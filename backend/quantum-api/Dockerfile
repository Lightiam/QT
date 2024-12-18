# Use Python 3.12 slim image as builder
FROM python:3.12-slim as builder

# Set working directory
WORKDIR /app

# Install poetry
RUN pip install poetry
RUN poetry config virtualenvs.in-project true

# Copy poetry files
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-dev --no-root

# Copy application code
COPY . .
RUN poetry install --no-dev

# Production image
FROM python:3.12-slim

WORKDIR /app

# Copy virtual environment and application code from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/app /app/app

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PORT=8080

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
