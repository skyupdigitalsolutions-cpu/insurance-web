import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Tell eslint-plugin-react the version instead of letting it detect it (detection fails on ESLint 10)
  { settings: { react: { version: '19.3' } } },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
