# PSLE Otter - tiny, dependency-free Node image (~50 MB).
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

# No npm install needed: the app has zero dependencies.
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node public ./public

USER node
EXPOSE 8080

# Works on any host that sets $PORT (Cloud Run, Render, Fly, Koyeb, Railway...).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
