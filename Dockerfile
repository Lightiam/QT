# Build frontend
FROM node:20-slim as frontend-builder
WORKDIR /app
COPY quantum-ide/package*.json ./
RUN npm install
COPY quantum-ide/ ./
RUN npm run build

# Build backend
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/quantum-api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/quantum-api/ ./

# Copy frontend build
COPY --from=frontend-builder /app/dist /app/static

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
