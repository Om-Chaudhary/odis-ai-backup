const { withNxMetro } = require("@nx/expo/metro");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const defaultConfig = getDefaultConfig(__dirname);

module.exports = (async () => {
  const nxConfig = await withNxMetro(defaultConfig, {
    projectRoot: __dirname,
    workspaceRoot: path.resolve(__dirname, "../.."),
  });

  return withNativeWind(nxConfig, {
    input: "./src/styles/global.css",
  });
})();
