# React Native Project Setup — Simplified Guide (2025)

This is a simplified setup and theory reference based on your current development flow, using Ignite CLI and React Native 0.76. It separates core setup steps from code-heavy implementation details (which now live in separate documents).

---

## 🔧 Project Creation Summary

You created your project using the following command:

```bash
npx ignite-cli new Visu \
  --bundle=com.legingerdev.visu \
  --git=false \
  --install-deps=false \
  --packager=npm \
  --target-path=C:\Users\Jordan\Documents\ReactNative\Visu \
  --remove-demo \
  --workflow=manual \
  --no-timeout=false
```

---

## ✅ Project Stack Overview

* **React Native**: `0.76`
* **React**: `18.2.0`
* **Ignite CLI**: Used for scaffolding and generators
* **Expo Dev Client**: For full native access
* **Folder structure**: Uses `app/` instead of `src/`, matching your existing patterns

---

## 🚀 Setup Checklist (after project creation)

### 1. Install Dependencies

Update your `package.json`:

```json
"react": "18.2.0",
"react-native": "0.76.0",
"react-test-renderer": "18.2.0"
```

Then run:

```bash
npm install --legacy-peer-deps
# or
yarn install
```

---

### 2. Folder Structure (No manual creation needed)

You don’t need to run `mkdir -p` commands — Ignite already scaffolds this:

```
app/
├── components/
├── screens/
├── navigators/  → rename to navigation/ (optional)
├── services/
├── utils/
├── config/
├── models/      → can be skipped if not using MST
├── theme/       → optional (use for constants/colors)
├── app.tsx
```

> ✅ Treat `app/` as your `src/`

---

### 3. Setup Metro Aliases

Update `metro.config.js`:

```js
resolver: {
  alias: {
    '@': './app',
    '@components': './app/components',
    '@screens': './app/screens',
    '@navigation': './app/navigation',
    '@services': './app/services',
    '@utils': './app/utils',
    '@constants': './app/constants',
    '@hooks': './app/hooks',
    '@types': './types',
  }
}
```

Then run:

```bash
npx react-native start --reset-cache
```

---

### 4. Navigation Setup (Manual, per your preference)

Use your own folder structure inside `app/navigation/`:

* `AppNavigator.tsx`
* `MainNavigator.tsx`
* `AuthNavigator.tsx`
* `routes.ts`
* `navigationService.ts`

Install navigation dependencies:

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
cd ios && pod install && cd .. # for iOS only
```

---

## 📦 Recommended Packages

* **API Handling**: Add your custom `ApiService.ts`
* **State Management**: Add Redux Toolkit, Zustand, or skip if not needed
* **Hooks**: Add `app/hooks/useAuth.ts`, etc.
* **Environment**: Use `.env` with `expo-constants`

---

## 🧰 Development Commands

```bash
npx expo start               # Dev server (hot reload)
npx expo run:android         # Run Android build
npx expo run:ios             # Run iOS build
npx ignite-cli generate component Button
npx ignite-cli generate screen LoginScreen
```

---

## 📂 Other Reference Docs

* `README_PROJECTIMPLEMENTATION_GUIDELINES.md`: Code patterns, architecture, navigation
* `README_PROJECTUTILITIES_GUIDELINES.md`: Hook patterns, API service, constants, custom utils

Let this guide act as the starter theory and flow document — concise and tailored to your 2025 setup.

---

Want this converted into a printable PDF or included in your repo as a Markdown doc? Let me know!
