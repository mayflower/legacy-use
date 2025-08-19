# Multi-stage build for frontend optimization
FROM node:20-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY package.json pnpm-lock.yaml public/ app/ index.html vite.config.js tsconfig.json biome.json /web/
WORKDIR /web

FROM base AS dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile


# Final runtime stage
FROM base

WORKDIR /web

ENV DEBIAN_FRONTEND=noninteractive

COPY --from=dependencies /web/node_modules /web/node_modules

EXPOSE 5173

CMD [ "pnpm", "start" ]
