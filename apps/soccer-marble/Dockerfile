FROM hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68 AS builder
WORKDIR /app
COPY . .
RUN npm run reg \
    && npm run install:soccer-marble

RUN npm run app:soccer-marble:build
RUN rm -rf ./node_modules
RUN npm install --production \
    && npx mod-pruner prune --force 

FROM hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
RUN mkdir /app && chown node:node /app
WORKDIR /app

USER node
ENV PATH /app/node_modules/.bin:$PATH
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/soccer-marble/build ./
COPY --from=builder /app/apps/soccer-marble/package.json ./
COPY --from=builder /app/package-lock.json ./

EXPOSE 5000
CMD [ "node", "--experimental-loader=extensionless","./app.js" ]