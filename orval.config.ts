import { defineConfig } from 'orval';

export default defineConfig({
  endpoints: {
    input: './openapi.json',
    output: {
      target: './app/endpoints.ts',
      biome: true,
    },
  },
});
