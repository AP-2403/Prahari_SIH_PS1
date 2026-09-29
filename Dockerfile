# ==============================================================================
# PRAHARI (प्रहरी) — Multi-Stage Production Dockerfile
# Serves both the compiled React Frontend (SPA) & FastAPI Backend on a unified port
# ==============================================================================

# ── Stage 1: Build the React + Vite Frontend ─────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY prahari/prahari-frontend/package*.json ./
RUN npm ci

COPY prahari/prahari-frontend/ ./
RUN npm run build

# ── Stage 2: Python 3.11 Runtime with FastAPI ────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Set non-interactive debian frontend & python flags
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8010

# Install required system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY prahari/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application, database, and resources
COPY prahari/backend/ /app/prahari/backend/
COPY background/ /app/background/
COPY data/ /app/data/

# Copy compiled frontend from Stage 1 into expected distribution folder
COPY --from=frontend-builder /app/frontend/dist /app/prahari/prahari-frontend/dist

# Expose server port (supports dynamic $PORT on Render, Railway, Koyeb, HF Spaces)
EXPOSE 8010

WORKDIR /app/prahari/backend

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8010}/health || exit 1

# Launch FastAPI via uvicorn binding to dynamic $PORT
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8010}"]
