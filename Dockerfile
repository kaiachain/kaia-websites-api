# Install production dependencies from the committed pnpm lock file
FROM node:22.23.5-alpine AS deps

WORKDIR /usr/src/app

# pnpm version comes from the "packageManager" field in package.json
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Runtime image
FROM node:22.23.5-alpine

# Pick up OS security fixes (e.g. openssl) published after the base image was
# built, and remove npm/corepack: the app never calls them at runtime and the
# bundled npm ships its own (often vulnerable) copies of tar and friends.
RUN apk upgrade --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
     /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json app.js ./
COPY abis ./abis
COPY services ./services

CMD [ "node", "app.js" ]
