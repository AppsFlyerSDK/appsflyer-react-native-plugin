const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

async function readFileAsync(path) {
  return fs.promises.readFile(path, "utf8");
}

async function saveFileAsync(path, content) {
  return fs.promises.writeFile(path, content, "utf8");
}

function getPath(root, bundleId) {
  return path.join(
    root,
    "app/src/main/java",
    ...bundleId.split("."),
    "MainActivity.kt"
  );
}

const withOnNewIntent = (config) => {
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const path = getPath(
        mod.modRequest.platformProjectRoot,
        mod.android.package
      );
      const file = await readFileAsync(path);
      const updatedWithIntentOverride = mergeContents({
        src: file,
        newSrc: `  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
  }`,
        // inserts it after the first function in the activity class
        anchor: /\}/,
        offset: 2,
        tag: "appsflyer-on-new-intent",
        comment: "//",
      });
      // import android.content.Intent;
      const updatedWithImport = mergeContents({
        src: updatedWithIntentOverride.contents,
        newSrc: `import android.content.Intent`,
        // import as second line in the file
        anchor: /package/,
        offset: 1,
        tag: "appsflyer-import-intent",
        comment: "//",
      });
      await saveFileAsync(path, updatedWithImport.contents);
      return mod;
    },
  ]);
};

module.exports = function withAppsFlyerAndroid(config) {
  config = withOnNewIntent(config);
  return config;
};
