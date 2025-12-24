import tseslint from "typescript-eslint";
import nxPlugin from "@nx/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

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
      "vitest.config.shared.ts",
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
  // Next.js plugin for Next.js-specific linting rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
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
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          allowCircularSelfDependency: true,
          allow: ["^~/.*"],
          depConstraints: [
            // ============================================
            // PLATFORM CONSTRAINTS (Critical for Browser/Node separation)
            // ============================================
            {
              sourceTag: "platform:browser",
              onlyDependOnLibsWithTags: [
                "platform:browser",
                "platform:neutral",
              ],
            },
            {
              sourceTag: "platform:neutral",
              onlyDependOnLibsWithTags: ["platform:neutral"],
            },
            // platform:node can depend on any platform (no constraint needed)

            // ============================================
            // TYPE CONSTRAINTS (Architectural layers)
            // ============================================
            // Apps can depend on anything
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: [
                "type:app",
                "type:service",
                "type:integration",
                "type:data-access",
                "type:ui",
                "type:util",
                "type:config",
                "type:types",
                "type:testing",
              ],
            },
            // Features can depend on data-access, ui, util, types (ADDED for future feature libs)
            {
              sourceTag: "type:feature",
              onlyDependOnLibsWithTags: [
                "type:data-access",
                "type:ui",
                "type:util",
                "type:types",
              ],
            },
            // Services can depend on integrations, data-access, utils, config, types
            {
              sourceTag: "type:service",
              onlyDependOnLibsWithTags: [
                "type:service",
                "type:integration",
                "type:data-access",
                "type:util",
                "type:config",
                "type:types",
              ],
            },
            // Integrations can depend on data-access, utils, config, types
            {
              sourceTag: "type:integration",
              onlyDependOnLibsWithTags: [
                "type:integration",
                "type:data-access",
                "type:util",
                "type:config",
                "type:types",
              ],
            },
            // Data-access can depend on utils, config, types
            {
              sourceTag: "type:data-access",
              onlyDependOnLibsWithTags: [
                "type:data-access",
                "type:util",
                "type:config",
                "type:types",
              ],
            },
            // UI can depend on utils, types
            {
              sourceTag: "type:ui",
              onlyDependOnLibsWithTags: ["type:ui", "type:util", "type:types"],
            },
            // Utils can depend on utils, config, types
            {
              sourceTag: "type:util",
              onlyDependOnLibsWithTags: [
                "type:util",
                "type:config",
                "type:types",
              ],
            },
            // Config can depend on config only (foundation)
            {
              sourceTag: "type:config",
              onlyDependOnLibsWithTags: ["type:config"],
            },
            // Types can depend on types only (foundation)
            {
              sourceTag: "type:types",
              onlyDependOnLibsWithTags: ["type:types"],
            },
            // Testing can depend on anything
            {
              sourceTag: "type:testing",
              onlyDependOnLibsWithTags: [
                "type:testing",
                "type:service",
                "type:integration",
                "type:data-access",
                "type:ui",
                "type:util",
                "type:config",
                "type:types",
              ],
            },

            // ============================================
            // SCOPE CONSTRAINTS (Domain boundaries)
            // ============================================
            // Extension scope can only use shared and extension libs (CRITICAL: No server access)
            {
              sourceTag: "scope:extension",
              onlyDependOnLibsWithTags: ["scope:extension", "scope:shared"],
            },
            // Server scope can use server and shared libs
            {
              sourceTag: "scope:server",
              onlyDependOnLibsWithTags: ["scope:server", "scope:shared"],
            },
            // Shared scope can only use shared libs
            {
              sourceTag: "scope:shared",
              onlyDependOnLibsWithTags: ["scope:shared"],
            },
          ],
        },
      ],
    },
  },
  // Chrome extension specific rules - needs strictNullChecks off
  {
    files: ["apps/chrome-extension/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.test.ts",
            "*.test.tsx",
            "vitest.config.ts",
            "vitest.config.shared.ts",
            "scripts/*.ts",
            "scripts/*.js",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
