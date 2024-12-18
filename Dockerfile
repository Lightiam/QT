# Build frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY quantum-ide/package*.json quantum-ide/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY quantum-ide/ .
RUN pnpm build

# Build backend
FROM python:3.12-slim AS backend-builder
WORKDIR /app/backend
COPY backend/quantum-api/pyproject.toml backend/quantum-api/poetry.lock ./
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-root
COPY backend/quantum-api/ .
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Final image
FROM python:3.12-slim
WORKDIR /app
COPY --from=backend-builder /app/backend /app
ENV PORT=8080
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
