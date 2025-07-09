import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettierConfig, // Add prettier config
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier, // Add prettier plugin
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ], // Change to warn and ignore unused vars prefixed with _
      'prettier/prettier': 'error', // Enable prettier rule
      'no-console': 'warn', // Disallow console.log in production
      'no-debugger': 'error', // Disallow debugger
      'prefer-const': 'error', // Require const for variables that are never reassigned
      eqeqeq: 'error', // Require === and !==
      'no-trailing-spaces': 'error', // Disallow trailing whitespace
      "indent": "off", // Let prettier handle indentation
      "quotes": "off", // Let prettier handle quotes
      semi: ['error', 'always'], // Enforce semicolons
    },
  }
);
