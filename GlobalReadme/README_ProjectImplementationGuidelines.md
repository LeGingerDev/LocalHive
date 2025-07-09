# Project Implementation Guidelines

This document outlines how the application is structured, how navigation flows work, and how files and folders are intended to be used throughout the codebase.

---

## 🧱 Folder Roles & Conventions

### `app/components/`

* **Reusable UI elements** shared across screens
* Split into subfolders:

  * `common/`: General-purpose (e.g., Button, Input)
  * `forms/`: Form-related components (e.g., FormField, ErrorText)

### `app/screens/`

* Full-screen views and routes.
* Typically aligned with navigation structure:

  * `screens/Auth`: Login, Register, ForgotPassword
  * `screens/Main`: Dashboard, Settings, etc.

### `app/navigation/`

* **All navigation logic** (formerly `navigators`):

  * `AppNavigator.tsx`: Entry point
  * `MainNavigator.tsx`: After-auth routes
  * `AuthNavigator.tsx`: Public routes
  * `routes.ts`: Centralized screen names
  * `navigationService.ts`: Imperative navigation functions

### `app/services/`

* Application logic, non-UI

  * `api/`: API endpoints, clients, request wrappers
  * `storage/`: AsyncStorage, local caching
  * `notifications/`: Push/local notification logic

### `app/utils/`

* Pure utility functions
* Formatting, validation, helpers

### `app/hooks/`

* Custom React hooks (e.g., `useAuth`, `useDebounce`)

### `app/constants/`

* Static config:

  * Color palettes
  * Routes
  * Default settings
  * Text labels

### `types/`

* Type declarations (external folder):

  * Shared interfaces
  * Navigation types
  * Response shapes

---

## 🧭 Navigation Pattern

* Use `@react-navigation/native` with `createNativeStackNavigator`
* Screen names are defined in `routes.ts`
* Navigators import screen components from `app/screens`

```ts
export const routes = {
  Login: 'Login',
  Home: 'Home',
  Settings: 'Settings',
};
```

```tsx
// AppNavigator.tsx
return (
  <NavigationContainer>
    {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
  </NavigationContainer>
);
```

---

## 🧩 Component vs Screen

* **Screen** = Route, view, or page
* **Component** = Reusable UI element

Screens should **not** contain deep logic. Break complex areas into `components/`.

```bash
app/screens/LoginScreen.tsx       → View logic
app/components/forms/LoginForm.tsx → UI + validation
```

---

## 🔄 State Management

* Project is open to:

  * Redux Toolkit
  * Zustand
  * React Context
* All logic should be colocated with hooks and services

Example:

```ts
// useAuth.ts
const useAuth = () => {
  const login = async (email, password) => { ... };
  return { login };
}
```

---

## 🧪 Testing Guidelines (Optional)

* Testing is opt-in; can be excluded during early development
* Preferred tools:

  * `@testing-library/react-native`
  * `jest`
  * Mock service layer calls instead of UI interactions

---

## 🌍 Environment Setup

* `.env` file for secrets
* Use `expo-constants` or `react-native-config`

Example:

```
API_URL=https://api.myserver.com
```

---

This file is focused purely on **structure and conventions**. For implementation utilities, custom hooks, or service usage, see `README_PROJECTUTILITIES_GUIDELINES.md`.
