FROM node:22.23.1-bookworm-slim AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV MONGOMS_DISABLE_POSTINSTALL=true

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --filter @eqourse/api...

FROM dependencies AS build

COPY tsconfig.base.json turbo.json ./
COPY apps/api apps/api
COPY packages/adapters packages/adapters
COPY packages/shared packages/shared

RUN pnpm --filter @eqourse/api... build
RUN pnpm --filter @eqourse/api deploy --prod --legacy /prod/api

FROM node:22.23.1-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=build --chown=node:node /prod/api ./

USER node

EXPOSE 8080

CMD ["node", "dist/main.js"]
