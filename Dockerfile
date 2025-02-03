# ---- Stage 1: builder ----
    FROM node:20-slim AS builder
    RUN apt-get update -y && apt-get install -y openssl git && \
        npm install -g pnpm@9.12.3
    WORKDIR /app
    
    # 依存関係をインストールするために必要なファイルをコピー
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
    COPY packages/prisma ./packages/prisma
    COPY apps/nestjs ./apps/nestjs
    
    # 依存関係をインストール
    RUN pnpm install --frozen-lockfile
    
    # Prisma Clientの生成とパッケージビルド
    RUN cd packages/prisma && \
        pnpm prisma generate && \
        pnpm build && \
        cd ../..
    
    # Build NestJS app
    RUN cd apps/nestjs && \
        pnpm build && \
        cd ../..
    
    # 本番用の軽量コンテナを作成
    FROM node:20-slim
    RUN apt-get update -y && apt-get install -y openssl && \
        npm install -g pnpm@9.12.3
    WORKDIR /app
    
    # build ステージから必要なファイルをコピー
    COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
    
    # アプリ・パッケージの成果物および設定をコピー
    COPY --from=builder /app/apps/nestjs/package.json ./apps/nestjs/
    COPY --from=builder /app/apps/nestjs/dist ./apps/nestjs/dist
    COPY --from=builder /app/packages/prisma/package.json ./packages/prisma/
    COPY --from=builder /app/packages/prisma/dist ./packages/prisma/dist
    COPY --from=builder /app/packages/prisma/schema.prisma ./packages/prisma/
    COPY --from=builder /app/packages/prisma/migrations ./packages/prisma/migrations
    COPY --from=builder /app/node_modules/.pnpm/@prisma+client@6.3.0_prisma@6.3.0_typescript@5.7.3__typescript@5.7.3/node_modules/.prisma ./node_modules/.pnpm/@prisma+client@6.3.0_prisma@6.3.0_typescript@5.7.3__typescript@5.7.3/node_modules/.prisma
    
    # 本番用依存関係だけをインストール (workspaceリンクは残す)
    RUN pnpm install --frozen-lockfile --prod --ignore-scripts && \
        pnpm rebuild
    
    # 環境変数の設定
    ENV NODE_ENV=production
    ENV PORT=8080
    ENV HOST=0.0.0.0
    
    # コンテナ起動時に DB のマイグレーションを適用してアプリを起動
    CMD cd packages/prisma && \
        npx prisma migrate deploy && \
        cd ../.. && \
        node apps/nestjs/dist/main
