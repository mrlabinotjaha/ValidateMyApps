#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm ci
npm run build

echo "Copying frontend build to backend static directory..."
mkdir -p ../backend/static
cp -r dist/* ../backend/static/

echo "Build complete!"
