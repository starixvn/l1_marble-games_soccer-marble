ARG NODE_IMAGE=hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68
ARG APP_NAME=@soccer-marble/soccer-marble

# ---------------------------- deps --------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/2003/package.json apps/2003/package.json
COPY apps/soccer-marble/package.json apps/soccer-marble/package.json
COPY packages/*/package.json packages/

RUN npm set registry http://npm.lumigame.com

RUN npm ci

# ---------------------------- build --------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY --from=deps /app /app

COPY . .

RUN npm i
RUN npm run shared:build
RUN npm run app:2003:build
RUN npm prune --omit=dev --workspaces
RUN npx mod-pruner prune --force

# ---------------------------- runner -------------------------------
FROM ${NODE_IMAGE} AS runner
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN mkdir /app && chown node:node /app
USER node
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

COPY --from=build /app/node_modules ./node_modules

COPY --from=build /app/apps/2003/build ./       
COPY --from=build /app/apps/2003/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json

# copy symlink targets for workspace packages used at runtime
COPY --from=build /app/apps/soccer-marble/ ./apps/soccer-marble/
COPY --from=build /app/packages/ ./packages/

EXPOSE 5000
CMD ["node", "--experimental-loader=extensionless", "./app.js"]