import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['nodes/**/*.ts', 'credentials/**/*.ts'],
  root: '.',
  outDir: 'dist',
  unbundle: true,
  format: 'cjs',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  fixedExtension: false,
  deps: {
    neverBundle: ['n8n-workflow'],
  },
  copy: [
    { from: 'nodes/**/*.{png,svg,json}', to: 'dist/nodes', flatten: false },
    {
      from: 'credentials/**/*.{png,svg,json}',
      to: 'dist/credentials',
      flatten: false,
    },
  ],
});
