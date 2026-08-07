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
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
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
      // Zahlen in Template-Literalen sind hier idiomatisch (IDs, Labels, Meldungen).
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Void-Rückgaben in Arrow-Shorthands (Callbacks, Setter) sind gewollt knapp.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      // Projektstil: explizite `as`-Casts statt Non-Null-Assertions (AGENTS.md).
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
  // Test-Dateien: Node-Globals zusätzlich erlauben
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Tests sichern bewusst auch statisch „unmögliche" Zustände ab (Fixtures, DOM-Nullability).
      '@typescript-eslint/no-unnecessary-condition': 'off',
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
