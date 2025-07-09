# Project Utilities & Code Patterns

This document outlines reusable patterns and helper logic for the project. These include custom hooks, API services, data formatting, storage, and validation logic used across screens and components.

---

## 🔗 API Service Pattern

### Structure

```bash
app/services/api/
├── Api.ts            → Axios instance
├── endpoints.ts      → Endpoint constants
├── AuthApi.ts        → Auth-specific requests
└── UserApi.ts        → User profile, data, etc.
```

### Api.ts Example

```ts
import axios from 'axios';
import Constants from 'expo-constants';

export const api = axios.create({
  baseURL: Constants?.manifest?.extra?.API_URL || 'https://default-api.com',
  timeout: 10000,
});
```

---

## 🧠 Custom Hook Examples

### useAuth.ts

```ts
import { useState } from 'react';
import { AuthApi } from '@/services/api/AuthApi';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await AuthApi.login(email, password);
      return response.data;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};
```

### useDebounce.ts

```ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
```

---

## 🗂 AsyncStorage Service

```ts
// app/services/storage/Storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  get: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  set: async (key: string, value: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  remove: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};
```

---

## 📏 Validation Helpers

```ts
export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isPassword = (value: string): boolean =>
  value.length >= 6;
```

---

## 🎨 Constants Pattern

```ts
// app/constants/Colors.ts
export const Colors = {
  primary: '#FF9900',
  secondary: '#1E1E1E',
  white: '#FFFFFF',
  error: '#FF3B30',
};
```

```ts
// app/constants/Routes.ts
export const Routes = {
  LOGIN: 'Login',
  HOME: 'Home',
  SETTINGS: 'Settings',
};
```

---

## 📚 Suggested Libraries

* `axios` for requests
* `expo-constants` for env vars
* `@react-native-async-storage/async-storage`
* `date-fns` or `dayjs` for date formatting
* `yup` or `zod` for form validation (optional)

---

This document evolves with the reusable patterns and helper modules added over time. Use it to maintain consistency and avoid repeated logic across the app.
