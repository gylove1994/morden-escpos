import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: true,
  markdown: {
    overrides: {
      'ts/no-unused-expressions': 'off',
      'no-undef': 'off',
    },
  },
  ignores: [
    '.agents',
    '.turbo',
    'node_modules',
    'dist',
    'build',
    'coverage',
    'dist-test',
    'dist-test-coverage',
    '**/*.md/**',
  ],
  rules: {
    'style/no-tabs': [
      'error',
      {
        allowIndentationTabs: true,
      },
    ],
    'unused-imports/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    'style/semi': [
      'error',
      'always',
    ],
    'jsdoc/check-alignment': 'off',
    'no-console': 'off',
    'dot-notation': 'off',
    'react-refresh/only-export-components': 'off',
    'node/prefer-global/process': 'off',
  },
});
