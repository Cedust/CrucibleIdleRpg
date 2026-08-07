import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  // Test-Dateien: Node-Globals zusätzlich erlauben
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  // Engine-Reinheit (AGENTS.md): pure Simulation — Zufall kommt aus dem geseedeten PRNG
  {
    files: ['src/features/*/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'zustand',
                'zustand/*',
                '@/features/*/state/*',
                '@/features/*/ui/*',
              ],
              message:
                'Engine-Module sind pure Simulation: importierbar sind Engine-Nachbarn, @/game und @/shared (AGENTS.md).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'setTimeout',
          message: 'Die Engine kennt keine Zeit; Playback taktet im Store (AGENTS.md).',
        },
        {
          name: 'setInterval',
          message: 'Die Engine kennt keine Zeit; Playback taktet im Store (AGENTS.md).',
        },
        { name: 'requestAnimationFrame', message: 'Die Engine kennt kein DOM (AGENTS.md).' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message: 'Die Engine kennt keine Zeit; Seeds kommen aus dem Save (AGENTS.md).',
        },
        {
          object: 'Math',
          property: 'random',
          message: 'Zufall kommt aus dem geseedeten PRNG (@/shared/utils/prng, AGENTS.md).',
        },
      ],
    },
  },
  // Prettier zuletzt: deaktiviert formatierungsbezogene Regeln
  prettier,
);
