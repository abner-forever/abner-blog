import { defineConfig } from 'orval';

export default defineConfig({
  blogApi: {
    input: {
      target: 'http://localhost:8080/api-docs-json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/services/generated',
      schemas: 'src/services/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: 'src/services/http.ts',
          name: 'httpMutator',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
        operations: {},
      },
    },
  },
});
