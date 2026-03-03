FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY app/package.json app/package-lock.json* ./
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app ./
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "run", "start"]
