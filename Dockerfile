# ---- Stage 1: builder ----
    FROM node:20-slim AS builder
    RUN apt-get update -y && apt-get install -y openssl git && corepack enable
    WORKDIR /app
    
    # Copy all files needed for installation
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
    COPY packages/prisma ./packages/prisma
    COPY apps/nestjs ./apps/nestjs
    
    # Install dependencies
    RUN pnpm install --frozen-lockfile
    
    # Generate Prisma Client first
    RUN cd packages/prisma && \
        pnpm prisma generate && \
        pnpm build && \
        cd ../..
    
    # Build NestJS app
    RUN cd apps/nestjs && \
        pnpm build && \
        cd ../..
    
    # Production stage
    FROM node:20-slim
    RUN apt-get update -y && apt-get install -y openssl
    WORKDIR /app
    
    # Copy workspace config
    COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
    
    # Copy built apps and packages
    COPY --from=builder /app/apps/nestjs/package.json ./apps/nestjs/
    COPY --from=builder /app/apps/nestjs/dist ./apps/nestjs/dist
    COPY --from=builder /app/packages/prisma/package.json ./packages/prisma/
    COPY --from=builder /app/packages/prisma/dist ./packages/prisma/dist
    COPY --from=builder /app/packages/prisma/schema.prisma ./packages/prisma/
    COPY --from=builder /app/packages/prisma/migrations ./packages/prisma/migrations
    # Copy generated Prisma client
    COPY --from=builder /app/node_modules/.pnpm/@prisma+client@6.3.0_prisma@6.3.0_typescript@5.7.3__typescript@5.7.3/node_modules/.prisma ./node_modules/.pnpm/@prisma+client@6.3.0_prisma@6.3.0_typescript@5.7.3__typescript@5.7.3/node_modules/.prisma
    
    # Install only production dependencies while preserving workspace links
    RUN corepack enable && \
        pnpm install --frozen-lockfile --prod --ignore-scripts && \
        pnpm rebuild
    
    # Debug: Verify NestJS dependencies
    RUN ls -la node_modules && \
        ls -la node_modules/@nestjs || true && \
        pnpm list @nestjs/core
    
    # Set environment variables
    ENV NODE_ENV=production
    ENV PORT=8080
    ENV HOST=0.0.0.0
    
    # Run migrations and start the application
    CMD cd packages/prisma && \
        npx prisma migrate deploy && \
        cd ../.. && \
        node apps/nestjs/dist/main
