# Multi-stage build for frontend optimization
FROM node:20-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY package.json pnpm-lock.yaml public/ app/ index.html vite.config.js tsconfig.json biome.json /app/
WORKDIR /app

FROM base AS dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules


# Final runtime stage
FROM base

ENV DEBIAN_FRONTEND=noninteractive

COPY --from=dependencies /app/node_modules /app/node_modules

EXPOSE 5173

CMD [ "pnpm", "start" ]
