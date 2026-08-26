/**
 * ESLint flat config for react-native-appsflyer plugin
 * Optimized for TypeScript + React Native library development
 */

const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.claude/**',
      'example/**',
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
  },
  js.configs.recommended,
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,

      // JS/TS hygiene
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off', // Allow require() in CommonJS files
      '@typescript-eslint/no-require-imports': 'off', // Allow require() in CommonJS files
    },
  },
  {
    files: ['expo/**/*.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off', // Expo config plugins use require()
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-undef': 'off', // TypeScript handles this
      'no-redeclare': 'off', // base rule doesn't understand TS's const+type same-name pattern
    },
  },
];
