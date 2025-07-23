/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(@supabase|isows|@react-native|expo|expo-modules-core|react-native|@react-navigation|expo-constants|expo-system-ui|@react-native-firebase|@expo-google-fonts|expo-font|expo-asset)/.*)",
  ],
}
