#!/bin/bash
set -e

# Wait for database to be ready (Railway handles this, but good to have)
echo "Starting backend..."

# Create upload directory if it doesn't exist
mkdir -p uploads

# Run database migrations if Alembic is configured
# Uncomment when migrations are set up:
# alembic upgrade head

# Start the server
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
