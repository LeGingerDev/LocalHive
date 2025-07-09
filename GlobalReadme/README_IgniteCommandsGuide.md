# Ignite CLI Commands Guide

This document outlines the most commonly used Ignite CLI commands in this project, tailored for Ignite version \~11.0.0. Use this as a reference when scaffolding new components, screens, or navigators in your React Native app.

---

## 🚀 Core Ignite Commands

| Command                              | Description                                       |
| ------------------------------------ | ------------------------------------------------- |
| `npx ignite-cli new <AppName>`       | Create a new Ignite project                       |
| `npx ignite-cli cache` or `ignite c` | Manage dependency cache for faster installs       |
| `ignite generate component <Name>`   | Generate a reusable UI component                  |
| `ignite generate screen <Name>`      | Generate a screen component with navigation ready |
| `ignite generate navigator <Name>`   | Create a new navigator (stack or tab)             |
| `ignite --help`                      | Show help info and all available commands         |
| `ignite docs`                        | Open the official Ignite documentation in browser |

---

## ✅ Your Project Creation Example

You created your project using:

```bash
npx ignite-cli new LocalHiveProject \
  --bundle=com.legingerdev.localhiveproject \
  --git=false \
  --install-deps=false \
  --packager=npm \
  --remove-demo \
  --workflow=manual
```

---

## 🧱 Generate Patterns (Scaffolding)

### Component

```bash
ignite generate component MyButton
```

* Includes prop safety via `MyButton.props.ts`
* Sets up View + Text + styles + optional default values

### Screen

```bash
ignite generate screen HomeScreen
```

* Adds screen file under `app/screens`
* Registers route with navigator
* Adds default props + layout structure

### Navigator

```bash
ignite generate navigator Main
```

* Adds a new Stack/Tab navigator to `app/navigation/`
* Optionally links screens into `routes.ts`

---

## 🛡 Safety Defaults (Why You Use Ignite)

* All generated elements include:

  * Type-safe props
  * Memoized/pure functions
  * Defensive rendering (null checks)
  * Scoped styles using `ViewStyle`, `TextStyle`, etc.
  * Clear separation between component logic and visuals

You no longer need to enforce these patterns manually — Ignite CLI handles them during generation.

---

## 🔄 Tips & Helpers

### Clear Cache

```bash
npx ignite-cli cache
```

* Speeds up subsequent scaffolding by reusing templates

### Access Help

```bash
ignite --help
```

### Visit Documentation

```bash
ignite docs
```

* Opens the official Ignite CLI documentation in your browser

---

## 🔧 Advanced Workflow Suggestions

* Pair Ignite with your alias system and folder structure (`@/components`, `@/screens`, etc.)
* Integrate custom generator templates if the defaults need customization
* Use VSCode snippets for repetitive patterns

---

This doc should evolve with your workflow. If you create custom generators or aliases, update this file to keep team usage consistent.
