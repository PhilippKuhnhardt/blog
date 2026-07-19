import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  {
    ignores: [".astro/", ".vscode/", "dist/", "node_modules/", "public/"],
  },
  eslint.configs.recommended,
  ...tseslint.configs["flat/recommended"],
  ...astro.configs["flat/recommended"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      sourceType: "module",
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
];
