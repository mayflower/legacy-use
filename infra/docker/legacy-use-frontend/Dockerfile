FROM node:alpine

ENV DEBIAN_FRONTEND=noninteractive

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /web

COPY package.json pnpm-lock.yaml /web/
RUN pnpm install --frozen-lockfile

COPY . /web

EXPOSE 5173

CMD [ "pnpm", "start" ]
