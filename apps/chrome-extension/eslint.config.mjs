import baseConfig from '../../eslint.config.js';

export default [
  ...baseConfig,
  {
    files: ['apps/chrome-extension/**/*.{ts,tsx}'],
    rules: {
      // Disable Next.js specific rules - this is a Chrome extension
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',

      // Disable rules that require strictNullChecks (we have it disabled for extension)
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/no-base-to-string': 'off',

      // Allow any types in extension code (gradual migration)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Allow floating promises (common in extension event handlers)
      '@typescript-eslint/no-floating-promises': 'off',

      // Allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Disable import rules that may not work correctly
      'import-x/no-named-as-default': 'off',

      // Additional rules to relax for migrated codebase
      '@typescript-eslint/prefer-regexp-exec': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',

      // Disable rules whose plugins may not be loaded
      'react-hooks/exhaustive-deps': 'off',

      // Relax more rules for migrated codebase
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/unbound-method': 'off',

      // Disable a11y rules
      'jsx-a11y/no-autofocus': 'off',
    },
  },
];
