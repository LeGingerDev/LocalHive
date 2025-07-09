/* eslint-env node */
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Add path aliases for cleaner imports
config.resolver.alias = {
  "@": path.resolve(__dirname, "app"),
  "@components": path.resolve(__dirname, "app/components"),
  "@screens": path.resolve(__dirname, "app/screens"),
  "@navigation": path.resolve(__dirname, "app/navigators"),
  "@services": path.resolve(__dirname, "app/services"),
  "@utils": path.resolve(__dirname, "app/utils"),
  "@theme": path.resolve(__dirname, "app/theme"),
  "@config": path.resolve(__dirname, "app/config"),
  "@hooks": path.resolve(__dirname, "app/hooks"),
  "@types": path.resolve(__dirname, "types"),
  "@assets": path.resolve(__dirname, "assets"),
}

config.transformer.getTransformOptions = async () => ({
  transform: {
    // Inline requires are very useful for deferring loading of large dependencies/components.
    // For example, we use it in app.tsx to conditionally load Reactotron.
    // However, this comes with some gotchas.
    // Read more here: https://reactnative.dev/docs/optimizing-javascript-loading
    // And here: https://github.com/expo/expo/issues/27279#issuecomment-1971610698
    inlineRequires: true,
  },
})

// This is a temporary fix that helps fixing an issue with axios/apisauce.
// See the following issues in Github for more details:
// https://github.com/infinitered/apisauce/issues/331
// https://github.com/axios/axios/issues/6899
// The solution was taken from the following issue:
// https://github.com/facebook/metro/issues/1272
config.resolver.unstable_conditionNames = ["require", "default", "browser"]

// This helps support certain popular third-party libraries
// such as Firebase that use the extension cjs.
config.resolver.sourceExts.push("cjs")

module.exports = config
