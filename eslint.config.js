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
            // Type-based constraints
            // ============================================
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: ["type:app", "type:lib"],
            },
            {
              sourceTag: "type:lib",
              onlyDependOnLibsWithTags: ["type:lib"],
            },
            // ============================================
            // Platform-based constraints
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
            // Application layer
            // ============================================
            {
              sourceTag: "scope:web",
              onlyDependOnLibsWithTags: [
                "scope:web",
                "scope:ui",
                "scope:hooks",
                "scope:auth",
                "scope:styles",
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
                "scope:slack",
              ],
            },
            // ============================================
            // New Platform Apps (Chrome Extension, Electron)
            // ============================================
            {
              sourceTag: "scope:chrome-extension",
              onlyDependOnLibsWithTags: [
                "scope:ui",
                "scope:hooks",
                "scope:auth",
                "scope:styles",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:api-client",
                "scope:constants",
                "scope:env",
              ],
            },
            {
              sourceTag: "scope:electron",
              onlyDependOnLibsWithTags: [
                "scope:ui",
                "scope:hooks",
                "scope:auth",
                "scope:styles",
                "scope:utils",
                "scope:types",
                "scope:validators",
                "scope:api-client",
                "scope:db",
                "scope:constants",
                "scope:env",
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
                "scope:ai",
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
              sourceTag: "scope:hooks",
              onlyDependOnLibsWithTags: ["scope:hooks", "scope:utils"],
            },
            {
              sourceTag: "scope:auth",
              onlyDependOnLibsWithTags: [
                "scope:auth",
                "scope:env",
                "scope:types",
              ],
            },
            {
              sourceTag: "scope:styles",
              onlyDependOnLibsWithTags: ["scope:styles"],
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
