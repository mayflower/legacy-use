import { defineConfig } from 'orval';

export default defineConfig({
  endpoints: {
    input: './openapi.json',
    output: {
      target: './app/gen/endpoints.ts',
      biome: true,
    },
  },
});
