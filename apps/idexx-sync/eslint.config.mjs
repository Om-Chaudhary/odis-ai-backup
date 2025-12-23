import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    files: ["apps/idexx-sync/**/*.ts"],
    rules: {
      // Disable Next.js specific rules - this is a Node.js server
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",

      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      // Disable import rules that may not work correctly
      "import-x/no-named-as-default": "off",

      // Relax for async handlers
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
];

