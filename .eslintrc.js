/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["apps/**", "packages/**"],
  },
  {
    extends: ["@workspace/eslint-config/library.js"],
    languageOptions: {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: true,
      },
    },
  },
]
