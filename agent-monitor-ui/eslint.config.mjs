import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/components/agent-table.tsx", "src/components/subagent-table.tsx"],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local backup artifacts
    "node_modules.bak*/**",
    "package-lock.bak.*",
  ]),
]);

export default eslintConfig;
