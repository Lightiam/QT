# Use Node.js LTS image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN npm install -g pnpm && pnpm install --prod

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
