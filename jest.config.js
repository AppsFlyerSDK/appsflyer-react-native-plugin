const { createJsWithBabelPreset } = require('ts-jest');

const jsWithBabelPreset = createJsWithBabelPreset({
  tsconfig: 'tsconfig.json', // Ensure this matches your tsconfig file
  babelConfig: true,
});

module.exports = {
  preset: 'react-native',
  transform: {
    ...jsWithBabelPreset.transform,
    '^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  modulePathIgnorePatterns: ['<rootDir>/demos/'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts?(x)',
    '<rootDir>/__tests__/**/*.test.js?(x)',
  ],
  setupFiles: ['<rootDir>/__tests__/setup.js'],
};