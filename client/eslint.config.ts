// eslint.config.js
import js from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginQuery from '@tanstack/eslint-plugin-query';

export default defineConfig([
  ...pluginQuery.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: {
      js,
      '@typescript-eslint': tseslint.plugin,
      react: pluginReact,
      prettier: pluginPrettier,
    },
    rules: {
      // ESLint core rules
      ...js.configs.recommended.rules,

      // React rules
      ...pluginReact.configs.flat.recommended.rules,

      // Prettier integration
      'prettier/prettier': 'error',

      'no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          ignoreClassFields: true,
          ignoreEnums: true,
        },
      ],
      // Optional: warn on undefined vars
      'no-undef': 'warn',
      'react/react-in-jsx-scope': 'off',
    },
  },
]);
