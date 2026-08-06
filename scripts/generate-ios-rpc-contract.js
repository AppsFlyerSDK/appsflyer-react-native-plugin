#!/usr/bin/env node
/**
 * Generates __tests__/fixtures/ios-rpc-contract.json from the AppsFlyerRPC Swift source.
 *
 * The plugin talks to native over a stringly-typed JSON-RPC wire, so a typo'd param key is a
 * silent runtime no-op rather than a compile error. This fixture is the ground truth that
 * __tests__/rpc-wire-contract.test.js asserts every index.js call site against.
 *
 * Usage: node scripts/generate-ios-rpc-contract.js [path-to-AppsFlyerRPC-checkout]
 * Default checkout path is ../../XCodeProjects/appsflyer.sdk.ios relative to the repo root.
 *
 * The generated fixture is committed, so CI does not need the native checkout — only
 * regeneration does. Re-run this whenever the pinned AppsFlyerRPC version changes.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const nativeRoot =
  process.argv[2] ||
  path.resolve(repoRoot, "..", "..", "XCodeProjects", "appsflyer.sdk.ios");
const coreDir = path.join(nativeRoot, "AppsFlyerRPC", "AppsFlyerRPC", "Core");
const outFile = path.join(
  repoRoot,
  "__tests__",
  "fixtures",
  "ios-rpc-contract.json"
);

function read(file) {
  const full = path.join(coreDir, file);
  if (!fs.existsSync(full)) {
    console.error(
      `Cannot find ${full}\n` +
        `Pass the AppsFlyerRPC checkout path as argv[2], e.g.\n` +
        `  node scripts/generate-ios-rpc-contract.js ~/XCodeProjects/appsflyer.sdk.ios`
    );
    process.exit(1);
  }
  return fs.readFileSync(full, "utf8");
}

// Only structs registered in AFRPCParser's table are reachable; anything else 404s.
function registeredStructs(parserSource) {
  // Slice from the table declaration, not the first `methodName:` — starting at the latter
  // cuts the leading struct name off the first entry.
  const table = parserSource.slice(
    parserSource.indexOf("methodParsers"),
    parserSource.indexOf("static func parseRequest")
  );
  const names = new Set();
  for (const match of table.matchAll(/(AFRPC\w+Request)\.methodName:/g)) {
    names.add(match[1]);
  }
  return names;
}

// Splits the file into top-level `struct X { ... }` / `extension X { ... }` blocks, keyed by
// type name. Declarations always start at column 0 here, so tracking brace depth from that
// line is enough — no real parser needed. Extensions matter: AFRPCValidateAndLogInAppPurchase-
// V2Request declares `init(from:)` in an extension, so struct-only scanning reports zero params.
function structBlocks(source) {
  const lines = source.split("\n");
  const blocks = [];
  let current = null;
  let depth = 0;

  for (const line of lines) {
    if (current === null) {
      // `private struct URLOpenRequestImpl` / `CrossPromotionRequestImpl` are shared param
      // readers that registered requests delegate to — they must be indexed too.
      const match =
        /^(?:private |internal |public |fileprivate )?(?:final )?(?:struct|extension)\s+(\w+)/.exec(
          line
        );
      if (match) {
        current = { name: match[1], lines: [] };
        depth = 0;
      } else {
        continue;
      }
    }
    current.lines.push(line);
    depth += (line.match(/{/g) || []).length;
    depth -= (line.match(/}/g) || []).length;
    if (depth === 0 && current.lines.length > 1) {
      blocks.push(current);
      current = null;
    }
  }
  return blocks;
}

// requireURL's `key:` argument defaults to "url" (RPCParamHelpers.swift), so a bare
// requireURL(from: params) still reads a key — record it or the fixture under-reports.
const REQUIRE_URL_DEFAULT_KEY = "url";

// Marks a param whose key is a variable in a shared reader, pending resolution from the
// delegating call site's literal argument.
const PLACEHOLDER_PREFIX = "#";

// `try SomeHelper(from: params, someLabel: "literal")` — one level of delegation to a shared
// param reader. Captures the helper type and any literal arguments that resolve placeholders.
function extractDelegations(body) {
  const delegations = [];
  for (const m of body.matchAll(
    /try\s+([A-Z]\w*)\(\s*from:\s*params\s*([^)]*)\)/g
  )) {
    if (m[1] === "RPCParamHelpers") {
      continue;
    }
    const args = {};
    for (const a of m[2].matchAll(/(\w+):\s*"([^"]+)"/g)) {
      args[a[1]] = a[2];
    }
    delegations.push({ type: m[1], args });
  }
  return delegations;
}

function extractParams(body) {
  const params = {};
  const note = (key, required, accessor) => {
    // A key read by several accessors is required if ANY read path demands it.
    const existing = params[key];
    params[key] = {
      required: existing ? existing.required || required : required,
      accessor: existing ? existing.accessor : accessor,
    };
  };

  // RPCParamHelpers.require("key", as: T.self, from: params)
  for (const m of body.matchAll(/RPCParamHelpers\.require\(\s*"([^"]+)"/g)) {
    note(m[1], true, "require");
  }

  // RPCParamHelpers.requireBool/requireURL/requireInt64/... (from: params, key: "key")
  for (const m of body.matchAll(
    /RPCParamHelpers\.(require[A-Za-z0-9]*)\(\s*from:\s*params\s*,\s*key:\s*"([^"]+)"/g
  )) {
    note(m[2], true, m[1]);
  }

  // Same, but `key:` is a variable (CrossPromotionRequestImpl takes appIDKey so the same
  // reader can serve `appId` and `promotedAppId`). Record a placeholder; the caller's
  // literal argument resolves it during delegation merging.
  for (const m of body.matchAll(
    /RPCParamHelpers\.(require[A-Za-z0-9]*)\(\s*from:\s*params\s*,\s*key:\s*([a-z]\w*)\s*\)/g
  )) {
    note(`${PLACEHOLDER_PREFIX}${m[2]}`, true, m[1]);
  }

  // Bare RPCParamHelpers.requireURL(from: params) — relies on the key: default.
  for (const m of body.matchAll(
    /RPCParamHelpers\.requireURL\(\s*from:\s*params\s*\)/g
  )) {
    void m;
    note(REQUIRE_URL_DEFAULT_KEY, true, "requireURL");
  }

  // RPCParamHelpers.optionalBool / optionalBoolOrNil (from: params, key: "key", ...)
  for (const m of body.matchAll(
    /RPCParamHelpers\.(optional[A-Za-z0-9]*)\(\s*from:\s*params\s*,\s*key:\s*"([^"]+)"/g
  )) {
    note(m[2], false, m[1]);
  }

  // Direct reads. `guard let x = params["k"]` throws on absence -> required;
  // a plain `params["k"] as? T` assignment is optional.
  for (const line of body.split("\n")) {
    for (const m of line.matchAll(/params\["([^"]+)"\]/g)) {
      note(m[1], /\bguard\s+let\b/.test(line), "subscript");
    }
  }

  // Nested requirements are read off a local binding, not `params`, so the subscript scan
  // above misses them. The thrown error names the full dotted path — use that instead.
  for (const m of body.matchAll(
    /missingParameter\("([^"]+\.[^"]+)"\)/g
  )) {
    note(m[1], true, "nested");
  }

  return params;
}

const typedRequests = read("AFRPCTypedRequests.swift");
const parser = read("AFRPCParser.swift");
const registered = registeredStructs(parser);

const methods = {};
const skipped = [];

// A type's declaration and its `init(from:)` can live in separate blocks — merge by name.
const bodiesByType = new Map();
for (const block of structBlocks(typedRequests)) {
  const existing = bodiesByType.get(block.name) || [];
  existing.push(block.lines.join("\n"));
  bodiesByType.set(block.name, existing);
}

// Resolves a type's own params plus those of any shared reader it delegates to, substituting
// placeholder keys with the literal the caller passed.
function resolveParams(typeName, seen = new Set()) {
  if (seen.has(typeName)) {
    return {};
  }
  seen.add(typeName);
  const bodies = bodiesByType.get(typeName);
  if (!bodies) {
    return {};
  }
  const body = bodies.join("\n");
  const resolved = { ...extractParams(body) };

  for (const delegation of extractDelegations(body)) {
    for (const [key, meta] of Object.entries(
      resolveParams(delegation.type, seen)
    )) {
      if (!key.startsWith(PLACEHOLDER_PREFIX)) {
        resolved[key] = resolved[key] || meta;
        continue;
      }
      const literal = delegation.args[key.slice(PLACEHOLDER_PREFIX.length)];
      if (!literal) {
        throw new Error(
          `${typeName} delegates to ${delegation.type} but does not supply a literal for ` +
            `${key.slice(PLACEHOLDER_PREFIX.length)} — cannot resolve the param key statically.`
        );
      }
      resolved[literal] = resolved[literal] || meta;
    }
  }
  return resolved;
}

const bodiesByTypeEntries = [...bodiesByType.entries()];
for (const [typeName, bodies] of bodiesByTypeEntries) {
  const body = bodies.join("\n");
  const methodNameMatch = /static let methodName = "([^"]+)"/.exec(body);
  if (!methodNameMatch) {
    continue;
  }
  if (!registered.has(typeName)) {
    skipped.push(`${typeName} (${methodNameMatch[1]})`);
    continue;
  }

  const params = resolveParams(typeName);
  const unresolvedPlaceholder = Object.keys(params).find((k) =>
    k.startsWith(PLACEHOLDER_PREFIX)
  );
  if (unresolvedPlaceholder) {
    throw new Error(
      `${typeName} has an unresolved placeholder key ${unresolvedPlaceholder}`
    );
  }

  // A silently-empty entry would disable the wire check for that method — exactly the class
  // of failure this fixture exists to catch. Fail the build instead.
  const initBody = /init\(from[^)]*\) throws \{([\s\S]*?)\n {4}\}/.exec(body);
  const initIsNonTrivial = initBody && initBody[1].trim().length > 0;
  if (initIsNonTrivial && Object.keys(params).length === 0) {
    throw new Error(
      `${typeName} (${methodNameMatch[1]}) has a non-empty init(from:) but no params were ` +
        `extracted — the parser cannot see how it reads params. Extend the generator.`
    );
  }

  methods[methodNameMatch[1]] = { struct: typeName, params };
}

const unresolved = [...registered].filter(
  (name) => !Object.values(methods).some((m) => m.struct === name)
);
if (unresolved.length) {
  console.error(
    `Parser table references structs that were not parsed: ${unresolved.join(", ")}`
  );
  process.exit(1);
}

// The wire contract is generated from AppsFlyerRPC's Swift source, so _rpcPodVersion must
// reflect the podspec's pinned AppsFlyerRPC version — not this plugin's own package.json
// version, which tracks a different release cadence.
const podspecSource = fs.readFileSync(
  path.join(repoRoot, "react-native-appsflyer.podspec"),
  "utf8"
);
const rpcPodVersionMatch = /s\.dependency\s+'AppsFlyerRPC(?:\/Strict)?',\s*'([^']+)'/.exec(
  podspecSource
);
if (!rpcPodVersionMatch) {
  throw new Error(
    "Could not find an AppsFlyerRPC dependency pin in react-native-appsflyer.podspec"
  );
}

const fixture = {
  _generated:
    "AUTO-GENERATED by scripts/generate-ios-rpc-contract.js from AppsFlyerRPC Swift source. Do not edit by hand.",
  _source: "AFRPCTypedRequests.swift + AFRPCParser.swift",
  _rpcPodVersion: rpcPodVersionMatch[1],
  methods,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(fixture, null, 2)}\n`);

console.log(
  `Wrote ${Object.keys(methods).length} methods to ${path.relative(repoRoot, outFile)}`
);
if (skipped.length) {
  console.log(
    `Skipped ${skipped.length} unregistered struct(s) (unreachable, would 404): ${skipped.join(", ")}`
  );
}
