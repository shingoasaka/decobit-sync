import { config } from "./base.js"

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  ...config,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json"
      }
    }
  }
] 