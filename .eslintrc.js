/**
 * ESLint configuration for react-native-appsflyer plugin
 * Optimized for TypeScript + React Native library development
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },

  env: {
    node: true,
    es6: true,
  },

  plugins: [
    '@typescript-eslint',
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  rules: {
    // JS/TS hygiene
    'no-console': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in CommonJS files
    
    // Import/export rules - disabled because TypeScript handles this
    // and our index.d.ts properly declares all exports for ESLint compatibility
    'import/default': 'off',
    'import/named': 'off',
    'import/no-unresolved': 'off',
  },
  overrides: [
    {
      files: ['expo/**/*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off', // Expo config plugins use require()
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript-specific rules
        'no-undef': 'off', // TypeScript handles this
      },
    },
  ],

  ignorePatterns: [
    'node_modules/**',
    'demos/**',
    'android/**',
    'ios/**',
    'build/**',
    'dist/**',
    '__tests__/**',
    '*.config.js',
    'babel.config.js',
    'metro.config.js',
    'jest.config.js',
    'react-native.config.js',
  ],
};