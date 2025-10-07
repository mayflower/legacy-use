FROM node:alpine

ENV DEBIAN_FRONTEND=noninteractive

ARG VITE_PROXY_TARGET=backend
ENV VITE_PROXY_TARGET=$VITE_PROXY_TARGET

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /web

COPY package.json pnpm-lock.yaml /web/
RUN pnpm install --frozen-lockfile

COPY ./app /web/app
COPY ./public /web/public
COPY ./tsconfig.json /web/tsconfig.json
COPY ./vite.config.js /web/vite.config.js
COPY ./orval.config.ts /web/orval.config.ts
COPY ./index.html /web/index.html

# Build with Environment
RUN pnpm build

EXPOSE 5173

CMD [ "pnpm", "run", "preview", "--port", "5173" ]
