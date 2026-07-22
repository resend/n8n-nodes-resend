import { config } from '@n8n/node-cli/eslint';

export default [
  // Build tooling only; never shipped with the package, so the n8n Cloud
  // dependency restrictions do not apply to it.
  { ignores: ['tsdown.config.ts'] },
  ...config,
];
