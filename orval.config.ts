import { defineConfig } from 'orval';

export default defineConfig({
  endpoints: {
    input: './openapi.json',
    output: {
      target: './app/gen/endpoints.ts',
      override: {
        mutator: {
          path: './app/gen/custom-axios.ts',
          name: 'customInstance',
        },
      },
      biome: true,
    },
  },
});
