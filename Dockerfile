FROM hub.lumigame.com/base/node:24-alpine-25h2@sha256:db6c4f159ec81620010fc981b05814e38ef20866ec5cce546c20b491405b83a9 AS base
WORKDIR /app

### Builder
FROM base AS builder
COPY package.json package-lock.json nx.json ./
COPY packages packages
COPY apps apps
RUN npm run reg
RUN --mount=type=cache,target=/root/.npm npm install --ignore-scripts
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
RUN chmod +x /usr/local/bin/marbles && chown -R node:node /app
USER node
EXPOSE ${PORT}
CMD ["marbles"]
