// jest.config.js
module.exports = {
    preset: 'react-native',
    transform: {
      '^.+\\.[tj]sx?$': 'babel-jest', // Transforms JavaScript, TypeScript, JSX, and TSX files using babel-jest
    },
    modulePathIgnorePatterns: [
      '<rootDir>/demos/',
    ],
    testMatch: [
      '<rootDir>/__tests__/index.test.js?(x)',
    ],
    setupFiles: [
      '<rootDir>/__tests__/setup.js',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  };