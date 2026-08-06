#!/usr/bin/env node
/**
 * Generates __tests__/fixtures/android-rpc-contract.json from the plugin_bridge Kotlin source.
 *
 * Counterpart to generate-ios-rpc-contract.js — see __tests__/rpc-wire-contract.test.js for why
 * these fixtures exist.
 *
 * Android's parser reads every field through an `opt*` accessor, so no param is ever required:
 * a wrong key silently yields the accessor's default rather than an error. The default value is
 * therefore the interesting part of each entry (`optBoolean("shouldStop", true)` means a missing
 * key STOPS the SDK), and the generator records it.
 *
 * Usage: node scripts/generate-android-rpc-contract.js [path-to-appsflyer-android-sdk-checkout]
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const sdkRoot =
  process.argv[2] ||
  path.resolve(process.env.HOME || "", "appsflyer-android-sdk");
const parserFile = path.join(
  sdkRoot,
  "plugin_bridge",
  "src",
  "main",
  "java",
  "com",
  "appsflyer",
  "pluginbridge",
  "parser",
  "JsonRpcRequestParser.kt"
);
const outFile = path.join(
  repoRoot,
  "__tests__",
  "fixtures",
  "android-rpc-contract.json"
);

if (!fs.existsSync(parserFile)) {
  console.error(
    `Cannot find ${parserFile}\n` +
      `Pass the appsflyer-android-sdk checkout path as argv[2], e.g.\n` +
      `  node scripts/generate-android-rpc-contract.js ~/appsflyer-android-sdk`
  );
  process.exit(1);
}

const source = fs.readFileSync(parserFile, "utf8");

// `when (method) { "name" -> parseXRequest(params) | "name" -> XRequest }`
function dispatchTable(src) {
  const start = src.indexOf("return when (method)");
  const end = src.indexOf("Unknown or missing method", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate the when(method) dispatch block");
  }
  const block = src.slice(start, end);
  const table = {};
  for (const m of block.matchAll(
    /"([^"]+)"\s*->\s*(?:(parse\w+)\(params\)|(\w+))/g
  )) {
    table[m[1]] = m[2] || null; // null = parameterless singleton
  }
  return table;
}

// Splits out each `private fun parseXRequest(params: JSONObject) = ...` body.
function parserBodies(src) {
  const bodies = {};
  const fnPattern = /private fun (parse\w+)\(params: JSONObject\)/g;
  const starts = [...src.matchAll(fnPattern)].map((m) => ({
    name: m[1],
    index: m.index,
  }));
  starts.forEach((entry, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : src.length;
    bodies[entry.name] = src.slice(entry.index, end);
  });
  return bodies;
}

// `params.optString("key", "")` / `params.optStringList("key")` / `params.optNullableBoolean("k")`
const ACCESSOR_PATTERN =
  /params\.(opt\w+|get\w+)\(\s*"([^"]+)"\s*(?:,\s*([^),]+?)\s*)?\)/g;

// Defaults for the file-local extension helpers at the bottom of the parser.
const HELPER_DEFAULTS = {
  optNullableString: null,
  optNullableBoolean: null,
  optStringList: [],
};

function parseLiteral(raw) {
  if (raw === undefined) {
    return undefined;
  }
  const text = raw.trim();
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^"(.*)"$/.test(text)) return text.slice(1, -1);
  if (/^-?\d+L?$/.test(text)) return Number(text.replace(/L$/, ""));
  if (/^-?\d*\.\d+$/.test(text)) return Number(text);
  return text;
}

function extractParams(body) {
  const params = {};
  for (const m of body.matchAll(ACCESSOR_PATTERN)) {
    const [, accessor, key, rawDefault] = m;
    const isRequired = accessor.startsWith("get");
    const fallback = Object.prototype.hasOwnProperty.call(
      HELPER_DEFAULTS,
      accessor
    )
      ? HELPER_DEFAULTS[accessor]
      : parseLiteral(rawDefault);

    // A key read more than once (setUserFbLoginId reads fbLoginId as String then Long) keeps
    // the first accessor but stays required if any read path requires it.
    if (params[key]) {
      params[key].required = params[key].required || isRequired;
      continue;
    }
    params[key] = { accessor, required: isRequired, default: fallback };
  }

  // `?: emptyMap()` overrides the accessor's own null default.
  for (const m of body.matchAll(
    /params\.optJSONObject\(\s*"([^"]+)"\s*\)\?\.\w+\(\)\s*\?:\s*emptyMap\(\)/g
  )) {
    if (params[m[1]]) {
      params[m[1]].default = {};
    }
  }

  return params;
}

const table = dispatchTable(source);
const bodies = parserBodies(source);
const methods = {};
const missing = [];

for (const [method, parserFn] of Object.entries(table)) {
  if (parserFn === null) {
    methods[method] = { parser: null, params: {} };
    continue;
  }
  const body = bodies[parserFn];
  if (!body) {
    missing.push(`${method} -> ${parserFn}`);
    continue;
  }
  const params = extractParams(body);
  // An empty result for a real parser function means the extractor missed the read pattern —
  // silently emitting {} would disable the wire check for this method.
  if (Object.keys(params).length === 0) {
    throw new Error(
      `${parserFn} (${method}) yielded no params — extend the accessor pattern.`
    );
  }
  methods[method] = { parser: parserFn, params };
}

if (missing.length) {
  throw new Error(
    `Dispatch table references parser functions that were not found: ${missing.join(", ")}`
  );
}

const fixture = {
  _generated:
    "AUTO-GENERATED by scripts/generate-android-rpc-contract.js from plugin_bridge Kotlin source. Do not edit by hand.",
  _source:
    "plugin_bridge/src/main/java/com/appsflyer/pluginbridge/parser/JsonRpcRequestParser.kt",
  _note:
    "Every accessor is opt*, so no param is ever required — a wrong key yields `default` and a success response. Check `default` values, not `required`.",
  methods,
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(fixture, null, 2)}\n`);

const landmines = Object.entries(methods).flatMap(([method, spec]) =>
  Object.entries(spec.params)
    .filter(([, meta]) => meta.default === true || meta.default > 0)
    .map(([key, meta]) => `${method}.${key} = ${meta.default}`)
);

console.log(
  `Wrote ${Object.keys(methods).length} methods to ${path.relative(repoRoot, outFile)}`
);
if (landmines.length) {
  console.log(
    `Non-falsy opt* defaults (a missing key silently activates these):\n  ${landmines.join("\n  ")}`
  );
}
