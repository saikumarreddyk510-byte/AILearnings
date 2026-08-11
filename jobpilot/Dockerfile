# syntax=docker/dockerfile:1

# JobPilot — see ARCHITECTURE.md's "Security, privacy & Docker (Phase 7)"
# section for the SQLite-in-Docker rationale and known gotchas.
#
# node:*-bookworm-slim (Debian/glibc), not Alpine/musl — maximizes the
# chance better-sqlite3's prebuilt binary matches rather than forcing a
# from-source compile.

# ---- deps: install fresh, inside the container, for the container's own
#      platform/Node version — never copy host node_modules across. ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-only placeholders — never used at runtime, only so env.ts's
# validation and static-page generation succeed during `next build`.
ENV DATABASE_URL="file:./build-placeholder.db" \
    AUTH_SECRET="build-only-placeholder-not-used-at-runtime" \
    NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---- runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Explicitly copied — not solely relied on via standalone's traced
# node_modules — so `prisma migrate deploy`/`prisma db seed` work via
# `docker compose run`.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma ./prisma

# Fallback safety net in case Next's file-tracing (@vercel/nft) misses the
# native binding — verify empirically once Docker is actually run; likely
# a harmless no-op if tracing already caught it.
COPY --from=builder /app/node_modules/better-sqlite3/build ./node_modules/better-sqlite3/build

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
