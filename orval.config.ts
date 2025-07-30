import { defineConfig } from 'orval';

export default defineConfig({
  endpoints: {
    input: './openapi.yaml',
    output: './endpoints.ts',
  },
});
