# ---------- stage 1: build ----------
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# No API address is baked in here on purpose. The panel calls the API from its
# own server process, so the address depends on the network the container is
# run on, which is not known at build time. It is supplied at runtime as
# API_URL — see src/services/api.ts.
RUN npm run build

# ---------- stage 2: runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Next's standalone server binds `process.env.HOSTNAME || '0.0.0.0'`
# (server.js:9), and Docker sets HOSTNAME to the container id on every
# container — so that fallback never fires and the server would listen on eth0
# ONLY. Loopback stays unbound, and the HEALTHCHECK below, which probes
# 127.0.0.1, gets ECONNREFUSED on a panel that is serving pages perfectly well.
# This is the published setting for `output: "standalone"` in Docker.
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

RUN mkdir -p .next/cache && chown -R node:node .next/cache
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

