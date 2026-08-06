#!/usr/bin/env node
/**
 * Deterministic diff between index.ts and the canonical cross-plugin schema
 * (schemas/plugins-rpc-schema/appsflyer-plugins-rpc-schema.json, mirrored from
 * gitlab.appsflyer.com/mobile/appsflyer-plugins-rpc-schema).
 *
 * Parses index.ts with the TypeScript compiler API (already a devDependency) instead of
 * regex, so it finds every callRpc/callRpcVoid/callRpcWithCallback/dispatchRpc/onceRegistrar
 * call site and the literal param keys passed. Matches index.ts's dispatched (canonical) method
 * name against the schema's per-platform *wire* method name (schema.methods[].rpc.<platform>.method),
 * through the same native aliasing tables __tests__/rpc-wire-contract.test.js uses - matching
 * against schema.methods[].name directly is wrong, since that's the schema's public-API label,
 * not necessarily what's on the wire (e.g. index.ts dispatches "isDebug"; the schema's public
 * name for that same wire call is "enableDebug").
 *
 * Reports:
 *   1. schema methods index.ts never dispatches (on either platform)
 *   2. index.ts dispatches with no matching schema entry on either platform
 *   3. for methods present in both: params index.ts sends that no matched schema entry
 *      declares, and platform-required params no call site ever sends
 *
 * This is a report, not a hard gate — some mismatches are expected (native lifecycle hooks
 * like continueUserActivity/handleLaunchOptions aren't invoked from JS). Read the output and
 * judge each line; promote confirmed-real ones into __tests__/rpc-wire-contract.test.js if you
 * want them CI-enforced.
 *
 * Usage: node scripts/verify-plugin-schema.js
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(
  repoRoot,
  "schemas",
  "plugins-rpc-schema",
  "appsflyer-plugins-rpc-schema.json"
);
const indexPath = path.join(repoRoot, "index.ts");

const DISPATCH_CALLEES = new Set([
  "callRpc",
  "callRpcVoid",
  "callRpcWithCallback",
  "dispatchRpc",
]);

function callSitesFromIndexTs() {
  const source = fs.readFileSync(indexPath, "utf8");
  const sf = ts.createSourceFile(
    indexPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const sites = []; // { method, keys: string[] | null } - null means "can't statically verify"

  // null = params arg isn't a plain object literal we can read keys from (an Identifier like
  // `callRpcVoid("setConsentData", consentData)`, or a literal containing `...spread`).
  function objectLiteralKeys(node) {
    if (!node) return [];
    if (!ts.isObjectLiteralExpression(node)) return null;
    if (node.properties.some((p) => ts.isSpreadAssignment(p))) return null;
    return node.properties
      .map((p) => p.name && ts.isIdentifier(p.name) ? p.name.text : null)
      .filter(Boolean);
  }

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : null;

      if (name && DISPATCH_CALLEES.has(name)) {
        const [methodArg, paramsArg] = node.arguments;
        if (methodArg && ts.isStringLiteral(methodArg)) {
          sites.push({ method: methodArg.text, keys: objectLiteralKeys(paramsArg) });
        }
      }

      // onceRegistrar("registerDeeplinkListener") etc. - listener registration RPCs, no params.
      if (name === "onceRegistrar") {
        const [methodArg] = node.arguments;
        if (methodArg && ts.isStringLiteral(methodArg)) {
          sites.push({ method: methodArg.text, keys: [] });
        }
      }
    }

    ts.forEachChild(node, visit);
  }
  visit(sf);

  // Catch inline `"method": "..."` object literals (setUserFbLoginId-style) that skip callRpc
  // entirely to dodge Number()'s precision loss - params are template-literal text, not readable keys.
  for (const match of source.matchAll(/"method"\s*:\s*"([^"]+)"/g)) {
    if (!sites.some((s) => s.method === match[1])) {
      sites.push({ method: match[1], keys: null });
    }
  }

  return sites;
}

function schemaParamProps(entry, platform) {
  const params = entry.rpc?.[platform]?.parameters;
  return {
    properties: new Set(Object.keys(params?.properties || {})),
    required: new Set(params?.required || []),
  };
}

// Native rewrites the dispatched method string only (never params) before reading it - mirrors
// RNAppsFlyerImpl.swift `canonicalToIOSMethod` / RNAppsFlyerModule.kt `CANONICAL_TO_ANDROID_METHOD`,
// copied from __tests__/rpc-wire-contract.test.js. The schema's rpc.<platform>.method is the
// post-alias wire name, so matching against schema.name directly (as v1 of this script did)
// produces false positives for every aliased method - go through these tables first.
const IOS_METHOD_ALIASES = {
  init: "initialize",
  sendPushNotificationData: "handlePushNotification",
  updateServerUninstallToken: "registerUninstall",
};
const ANDROID_METHOD_ALIASES = {
  registerDeeplinkListener: "subscribeForDeepLink",
};

function main() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

  // wire method name -> schema entry, per platform. A dispatched name can match a different
  // schema entry per platform (e.g. sendPushNotificationData's ios wire name "handlePushNotification"
  // is its own separate schema entry, with different params than the android-only "sendPushNotificationData" entry).
  const wireIndex = { ios: new Map(), android: new Map() };
  for (const entry of schema.methods) {
    for (const platform of ["ios", "android"]) {
      const wireMethod = entry.rpc?.[platform]?.method;
      if (wireMethod) wireIndex[platform].set(wireMethod, entry);
    }
  }

  const sites = callSitesFromIndexTs();
  const dispatchedNames = new Set(sites.map((s) => s.method));
  const keysByMethod = new Map(); // dispatched name -> Set<string> | "dynamic"
  for (const { method, keys } of sites) {
    if (keysByMethod.get(method) === "dynamic") continue;
    if (keys === null) {
      keysByMethod.set(method, "dynamic");
      continue;
    }
    const existing = keysByMethod.get(method);
    const set = existing instanceof Set ? existing : new Set();
    keys.forEach((k) => set.add(k));
    keysByMethod.set(method, set);
  }

  const matchedSchemaNames = new Set();
  const missingFromSchema = [];
  const paramProblems = [];
  const unverifiable = [];

  for (const dispatched of dispatchedNames) {
    const matchByPlatform = {
      ios: wireIndex.ios.get(IOS_METHOD_ALIASES[dispatched] || dispatched),
      android: wireIndex.android.get(ANDROID_METHOD_ALIASES[dispatched] || dispatched),
    };
    const matchedEntries = [...new Set([matchByPlatform.ios, matchByPlatform.android].filter(Boolean))];

    if (matchedEntries.length === 0) {
      missingFromSchema.push(dispatched);
      continue;
    }
    matchedEntries.forEach((e) => matchedSchemaNames.add(e.name));

    const sentKeys = keysByMethod.get(dispatched);
    if (sentKeys === "dynamic") {
      unverifiable.push(dispatched);
      continue; // params built from a spread/variable - can't check keys statically
    }

    const knownAnywhere = new Set();
    for (const platform of ["ios", "android"]) {
      const entry = matchByPlatform[platform];
      if (!entry) continue;
      const { properties, required } = schemaParamProps(entry, platform);
      properties.forEach((p) => knownAnywhere.add(p));
      for (const req of required) {
        if (!sentKeys.has(req)) {
          paramProblems.push(
            `"${dispatched}" (schema "${entry.name}"): ${platform} requires "${req}", but no call site sends it`
          );
        }
      }
    }
    for (const key of sentKeys) {
      if (!knownAnywhere.has(key)) {
        paramProblems.push(`"${dispatched}": sends param "${key}" that no matched schema entry declares`);
      }
    }
  }

  const missingFromIndex = schema.methods
    .map((m) => m.name)
    .filter((n) => !matchedSchemaNames.has(n))
    .sort();
  missingFromSchema.sort();

  console.log(`schema methods: ${schema.methods.length}`);
  console.log(`index.ts dispatch sites: ${dispatchedNames.size}\n`);

  console.log(`=== in schema, never dispatched by index.ts (${missingFromIndex.length}) ===`);
  missingFromIndex.forEach((n) => console.log(`  ${n}`));

  console.log(`\n=== dispatched by index.ts, not in schema (${missingFromSchema.length}) ===`);
  missingFromSchema.forEach((n) => console.log(`  ${n}`));

  console.log(`\n=== param mismatches on methods present in both (${paramProblems.length}) ===`);
  paramProblems.forEach((p) => console.log(`  ${p}`));

  console.log(`\n=== params built dynamically (spread/variable) - not checked (${unverifiable.length}) ===`);
  unverifiable.sort().forEach((m) => console.log(`  ${m}`));

  const total = missingFromIndex.length + missingFromSchema.length + paramProblems.length;
  console.log(`\n${total} total finding(s).`);
  process.exit(total ? 1 : 0);
}

main();
