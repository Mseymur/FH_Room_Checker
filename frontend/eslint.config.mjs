import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { react, "react-hooks": hooks, "jsx-a11y": a11y },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...hooks.configs.recommended.rules,
      ...a11y.flatConfigs.recommended.rules,
      "react/prop-types": "off", // TypeScript checks component props.
    },
    settings: { react: { version: "detect" } },
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
