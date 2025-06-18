module.exports = {
  extends: [
    "next/core-web-vitals",
    "next/typescript"
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Add any custom rules here if needed
  },
};