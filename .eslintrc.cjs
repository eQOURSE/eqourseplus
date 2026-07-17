module.exports = {
  root: true,
  ignorePatterns: ["**/dist/**", "**/.next/**", "**/coverage/**"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: {
    es2022: true,
    node: true,
  },
  overrides: [
    {
      files: ["apps/web/**/*.{ts,tsx}"],
      extends: ["next/core-web-vitals"],
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  ],
};
