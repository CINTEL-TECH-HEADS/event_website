// ESLint flat config (ESLint 9). Next 16 dropped `next lint`; run `npm run lint`.
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `any` is used on purpose at Supabase/JSON boundaries across the codebase.
      '@typescript-eslint/no-explicit-any': 'off',
      // React Compiler advice. This app doesn't use the compiler, and the flagged
      // patterns (latest-value refs, fetch-on-mount effects) are intentional, so
      // keep them visible without failing lint.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'scripts/**',
    'supabase/**',
    // Components copied in from reactbits.dev and threeui, kept as upstream wrote them.
    'components/reactbits/**',
    'components/threeui/**',
  ]),
])
