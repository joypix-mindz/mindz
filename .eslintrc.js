module.exports = {
  root: true,
  settings: {
    react: {
      version: '18',
    },
    next: {
      rootDir: 'apps/web',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      globalReturn: false,
      impliedStrict: true,
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'simple-import-sort',
    'import',
    'unused-imports',
  ],
  rules: {
    'no-undef': 'off',
    'no-empty': 'off',
    'no-func-assign': 'off',
    'no-cond-assign': 'off',
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/dist'],
            message: "Don't import from dist",
            allowTypeImports: false,
          },
          {
            group: ['**/src'],
            message: "Don't import from src",
            allowTypeImports: false,
          },
        ],
      },
    ],
  },
};
