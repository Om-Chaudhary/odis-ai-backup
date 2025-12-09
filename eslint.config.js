import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
// @ts-ignore -- no types for this plugin
import drizzle from "eslint-plugin-drizzle";
import nxPlugin from "@nx/eslint-plugin";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [
      ".next",
      "src/database.types.ts",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "vitest.config.ts",
      "vitest.shared.ts",
      "vitest.workspace.ts",
      "libs/testing/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      drizzle,
      "@nx": nxPlugin,
    },
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // Disable unsafe-any rules for tRPC/Supabase compatibility
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db", "ctx.db"] },
      ],
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          allowCircularSelfDependency: false,
          allow: [],
          depConstraints: [
            {
              sourceTag: "scope:web",
              onlyDependOnLibsWithTags: [
                "scope:web",
                "scope:ui",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:services",
                "scope:db",
                "scope:vapi",
                "scope:idexx",
                "scope:api-client",
              ],
            },
            {
              sourceTag: "scope:services",
              onlyDependOnLibsWithTags: [
                "scope:services",
                "scope:db",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:vapi",
                "scope:idexx",
              ],
            },
            {
              sourceTag: "scope:db",
              onlyDependOnLibsWithTags: [
                "scope:db",
                "scope:utils",
                "scope:types",
                "scope:validators",
              ],
            },
            {
              sourceTag: "scope:ui",
              onlyDependOnLibsWithTags: [
                "scope:ui",
                "scope:utils",
                "scope:types",
              ],
            },
            {
              sourceTag: "scope:vapi",
              onlyDependOnLibsWithTags: [
                "scope:vapi",
                "scope:services",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:db",
                "scope:idexx",
              ],
            },
            {
              sourceTag: "scope:idexx",
              onlyDependOnLibsWithTags: [
                "scope:idexx",
                "scope:utils",
                "scope:types",
                "scope:validators",
              ],
            },
            {
              sourceTag: "scope:api-client",
              onlyDependOnLibsWithTags: [
                "scope:api-client",
                "scope:utils",
                "scope:types",
                "scope:validators",
              ],
            },
            {
              sourceTag: "scope:validators",
              onlyDependOnLibsWithTags: ["scope:validators", "scope:types"],
            },
            {
              sourceTag: "scope:types",
              onlyDependOnLibsWithTags: ["scope:types"],
            },
          ],
        },
      ],
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.test.ts", "*.test.tsx", "vitest.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
