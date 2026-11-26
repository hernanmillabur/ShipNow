FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    UPLOADS_DIR=/app/data/uploads \
    LOG_TO_FILE=false

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --chown=node:node src ./src
RUN mkdir -p /app/data/uploads /app/logs \
    && chown -R node:node /app

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
