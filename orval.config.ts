import { defineConfig } from 'orval';

export default defineConfig({
  endpoints: {
    input: './openapi.json',
    output: './endpoints.ts',
  },
});
