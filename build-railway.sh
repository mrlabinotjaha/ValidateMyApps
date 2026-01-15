#!/bin/bash
set -e

echo "Building for Railway..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm ci
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Copy frontend build to backend static directory
echo "Copying frontend build to backend..."
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo "Build complete!"
