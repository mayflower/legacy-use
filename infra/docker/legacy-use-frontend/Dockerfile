# Multi-stage build for frontend optimization
FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY package.json pnpm-lock.yaml public/ app/ index.html vite.config.js tsconfig.json biome.json /web
WORKDIR /web

EXPOSE 5173

CMD [ "pnpm", "start" ]
