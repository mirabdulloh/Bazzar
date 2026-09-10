FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` is plain `nest build`, which only builds the root project
# (bazaar-api). The batch worker needs an explicit build or
# dist/apps/bazaar-batch/main never exists. Each project has its own outDir,
# so deleteOutDir does not wipe the other.
RUN npm run build && npx nest build bazaar-batch

FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3007

CMD ["node", "dist/apps/bazaar-api/main"]
