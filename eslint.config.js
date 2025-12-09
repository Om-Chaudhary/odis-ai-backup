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
      ".next/**",
      "**/apps/web/.next/**",
      "apps/web/.next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/next-env.d.ts",
      "src/test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "vitest.config.ts",
      "vitest.shared.ts",
      "vitest.workspace.ts",
      "libs/testing/**",
      // Test utility files
      "**/test/setup.ts",
      "**/test/utils.tsx",
      "**/vitest.config.ts",
      "apps/web/vitest.config.ts",
      "apps/web/src/test/**",
      // Auto-generated files
      "src/database.types.ts",
      "libs/types/src/database.types.ts",
      // Markdown documentation
      "**/*.md",
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
          allowCircularSelfDependency: true,
          allow: ["^~/.*"],
          depConstraints: [
            // ============================================
            // Application layer
            // ============================================
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
                "scope:api",
                "scope:ai",
                "scope:clinics",
                "scope:constants",
                "scope:crypto",
                "scope:email",
                "scope:env",
                "scope:logger",
                "scope:qstash",
                "scope:resend",
                "scope:retell",
              ],
            },
            // ============================================
            // Domain/Service layer
            // ============================================
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
                "scope:ai",
                "scope:qstash",
                "scope:clinics",
                "scope:resend",
                "scope:email",
                "scope:env",
                "scope:logger",
              ],
            },
            {
              sourceTag: "scope:vapi",
              onlyDependOnLibsWithTags: [
                "scope:vapi",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:db",
                "scope:idexx",
                "scope:logger",
                "scope:qstash",
                "scope:clinics",
                "scope:env",
              ],
            },
            {
              sourceTag: "scope:idexx",
              onlyDependOnLibsWithTags: [
                "scope:idexx",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:retell",
                "scope:crypto",
                "scope:db",
                "scope:vapi",
              ],
            },
            // ============================================
            // Infrastructure layer
            // ============================================
            {
              sourceTag: "scope:db",
              onlyDependOnLibsWithTags: [
                "scope:db",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:constants",
                "scope:logger",
                "scope:api",
                "scope:env",
              ],
            },
            {
              sourceTag: "scope:api",
              onlyDependOnLibsWithTags: [
                "scope:api",
                "scope:db",
                "scope:types",
                "scope:env",
                "scope:utils",
              ],
            },
            {
              sourceTag: "scope:clinics",
              onlyDependOnLibsWithTags: [
                "scope:clinics",
                "scope:types",
                "scope:logger",
                "scope:env",
              ],
            },
            {
              sourceTag: "scope:ai",
              onlyDependOnLibsWithTags: [
                "scope:ai",
                "scope:validators",
                "scope:types",
                "scope:env",
              ],
            },
            {
              sourceTag: "scope:email",
              onlyDependOnLibsWithTags: [
                "scope:email",
                "scope:validators",
                "scope:types",
              ],
            },
            {
              sourceTag: "scope:retell",
              onlyDependOnLibsWithTags: [
                "scope:retell",
                "scope:utils",
                "scope:vapi",
              ],
            },
            {
              sourceTag: "scope:crypto",
              onlyDependOnLibsWithTags: ["scope:crypto", "scope:env"],
            },
            {
              sourceTag: "scope:resend",
              onlyDependOnLibsWithTags: ["scope:resend", "scope:env"],
            },
            // ============================================
            // UI layer
            // ============================================
            {
              sourceTag: "scope:ui",
              onlyDependOnLibsWithTags: [
                "scope:ui",
                "scope:utils",
                "scope:types",
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
            // ============================================
            // Foundation layer (no/minimal deps)
            // ============================================
            {
              sourceTag: "scope:utils",
              onlyDependOnLibsWithTags: [
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
              onlyDependOnLibsWithTags: ["scope:types", "scope:validators"],
            },
            {
              sourceTag: "scope:logger",
              onlyDependOnLibsWithTags: ["scope:logger"],
            },
            {
              sourceTag: "scope:constants",
              onlyDependOnLibsWithTags: ["scope:constants"],
            },
            {
              sourceTag: "scope:qstash",
              onlyDependOnLibsWithTags: ["scope:qstash"],
            },
            {
              sourceTag: "scope:env",
              onlyDependOnLibsWithTags: ["scope:env"],
            },
            // ============================================
            // Testing (can depend on anything)
            // ============================================
            {
              sourceTag: "scope:testing",
              onlyDependOnLibsWithTags: [
                "scope:testing",
                "scope:types",
                "scope:validators",
                "scope:utils",
                "scope:db",
                "scope:vapi",
                "scope:services",
                "scope:api",
                "scope:ui",
              ],
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
