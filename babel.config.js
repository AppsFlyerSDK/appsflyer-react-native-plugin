// babel.config.js
module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
      '@babel/plugin-transform-class-properties',
    ],
  };