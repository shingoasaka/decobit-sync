FROM node:20-slim as builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install
RUN npm install -g @nestjs/cli

# Copy source code
COPY . .
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Build application
RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"] 