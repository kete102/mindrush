import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import drizzlePlugin from "eslint-config-prettier";
import eslintPrettierConfig from "eslint-config-prettier";
import { fixupPluginRules } from "@eslint/compat";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPrettierConfig,
  {
    plugins: {
      drizzle: fixupPluginRules(drizzlePlugin),
    },
  },
];
