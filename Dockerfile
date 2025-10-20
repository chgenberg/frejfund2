# Railway-friendly Dockerfile for Next.js standalone output
FROM ghcr.io/docker-library/node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM ghcr.io/docker-library/node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Generate Prisma Client before building
RUN npx prisma generate

# Build with memory optimizations
RUN npm run build

FROM ghcr.io/docker-library/node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"
# Include deps and source so the same image can run a worker
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Default role is web; set WORKER=1 in the worker service to run the queue worker
ENV WORKER=0
EXPOSE 3000
CMD ["sh", "-c", "if [ \"$WORKER\" = \"1\" ]; then npm run worker; else node server.js; fi"]


