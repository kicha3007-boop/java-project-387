import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Сгенерированное из спецификации не правится и не линтуется
  { ignores: ["dist", "node_modules", ".claude", "web/src/client", "server/src/generated", "spec/generated"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["server/**/*.ts", "e2e/**/*.ts", "*.config.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["web/src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
);
