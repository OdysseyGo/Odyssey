// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  // Adds global variables for Jest (it, describe, expect) and Node
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  plugins: ['react'],
  rules: {
    // Add custom rules here if needed
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: ['/dist/*', '/node_modules/*'],
};
