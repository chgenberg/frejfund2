# Railway-friendly Dockerfile for Next.js standalone output
FROM mcr.microsoft.com/devcontainers/javascript-node:20 AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM mcr.microsoft.com/devcontainers/javascript-node:20 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build optimization
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_LIGHTNINGCSS=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install all dependencies including devDeps to ensure build-time tools are available
ENV NODE_ENV=development
RUN npm ci --legacy-peer-deps --include=dev \
  && (npm install --no-save @next/swc-linux-x64-gnu@15.5.4 @next/swc-linux-x64-musl@15.5.4 lightningcss@latest || true) \
  && npm rebuild lightningcss || true

# Switch to production for the actual build
ENV NODE_ENV=production
ENV NEXT_DISABLE_LIGHTNINGCSS=1

# Generate Prisma Client before building
RUN npx prisma generate

# Build with memory optimizations
RUN npm run build

FROM mcr.microsoft.com/devcontainers/javascript-node:20 AS runner
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


