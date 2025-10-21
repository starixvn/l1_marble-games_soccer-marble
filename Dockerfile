FROM hub.lumigame.com/base/node:20.9.0-alpine-24h1.1@sha256:dee2343e5063098be2d8766e25b12b0bd7e3fc3982bd340d5b04e4f518574c68 AS base
WORKDIR /app

### Builder
FROM base AS builder
COPY package.json package-lock.json nx.json ./
COPY packages packages
COPY apps apps
RUN npm run reg
RUN --mount=type=cache,target=/root/.npm npm install --ignore-scripts
RUN npm run build || true # Resolve Flaky Tasks
RUN npm run build

### Cleaner
FROM base AS cleaner
COPY package.json package-lock.json nx.json ./
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps
RUN --mount=type=cache,target=/root/.npm npm install --omit=dev --ignore-scripts
RUN find . -type f -not -name "package.json" -not -path "*/dist/*" -not -path "*/node_modules/*" -delete && \
    find . -type f -name "*.d.ts" -delete && \
    find . -type d -empty -delete
RUN npx mod-pruner prune --force

### Production
FROM base AS app
COPY --from=cleaner /app .
COPY scripts/start.sh /usr/local/bin/marbles
RUN chmod +x /usr/local/bin/marbles
USER node
EXPOSE ${PORT}
CMD ["marbles"]
