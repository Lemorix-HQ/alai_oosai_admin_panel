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

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]