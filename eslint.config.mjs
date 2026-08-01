import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The static Pages build: scene.js and textures.js are type-stripped
    // output of app/*.ts, and vendor/ holds an unmodified three.js copy.
    // Lint the TypeScript sources instead.
    "docs/**",
  ]),
]);

export default eslintConfig;
