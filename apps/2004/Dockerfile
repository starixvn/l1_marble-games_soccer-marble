FROM hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68 AS builder
WORKDIR /app
COPY package.json package-lock.json .modprunerrc ./
RUN npm run reg \
    && npm install:2004
COPY . .

RUN npm run app:2004:build
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
COPY --from=builder /app/apps/2004/build ./
COPY --from=builder /app/apps/2004/package.json ./
COPY --from=builder /app/package-lock.json ./

EXPOSE 5000
CMD [ "node", "--experimental-loader=extensionless","./app.js" ]