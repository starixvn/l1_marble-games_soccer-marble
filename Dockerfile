FROM hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68 AS builder
WORKDIR /app
COPY package.json yarn.lock .modprunerrc ./
RUN npm run reg \
    && yarn install
COPY . .

RUN npm run build
RUN rm -rf ./node_modules
RUN yarn install --production \
    && npx mod-pruner prune --force 

FROM hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
RUN mkdir /app && chown node:node /app
WORKDIR /app

USER node
ENV PATH /app/node_modules/.bin:$PATH
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

EXPOSE 5000
CMD [ "node", "--experimental-loader=extensionless","./app.js" ]