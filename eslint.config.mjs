import { config } from '@n8n/node-cli/eslint';

export default [
  { ignores: ['tsdown.config.ts', 'vitest.config.ts', 'tests/**'] },
  ...config,
];
