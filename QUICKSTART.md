# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Python 3.9+ installed
- Node.js 18+ installed

## Step 1: Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432.

## Step 2: Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example if needed)
# Make sure DATABASE_URL points to: postgresql://appshowcase:appshowcase@localhost:5432/appshowcase
# SECRET_KEY should be set to a random string

# Create mock data
python create_mock_data.py

# Start the server
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## Step 3: Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
# VITE_API_URL=http://localhost:8000/api

# Start the dev server
npm run dev
```

The frontend will be available at http://localhost:5173

## Step 4: Test the Application

1. Open http://localhost:5173 in your browser
2. Try logging in with:
   - Username: `alice` / Password: `password123`
   - Username: `admin` / Password: `admin123`
3. Browse the apps on the dashboard
4. Click on an app to see details, vote, and comment
5. Create a new app using the "New App" button

## Test Users

- **admin** / admin123 - Admin user
- **alice** / password123 - Developer
- **bob** / password123 - Developer  
- **viewer1** / password123 - Viewer (read-only)

## Troubleshooting

### Database connection errors
- Make sure Docker is running
- Check that PostgreSQL container is up: `docker ps`
- Verify DATABASE_URL in backend/.env

### Port already in use
- Backend: Change port in uvicorn command: `--port 8001`
- Frontend: Vite will automatically use next available port

### Images not loading
- Mock data uses placeholder images from via.placeholder.com
- In production, images are served from backend/uploads/
- Make sure backend/uploads directory exists

## Next Steps

- Set up Alembic migrations for database versioning
- Configure production database settings
- Set up image upload directory permissions
- Customize UI styling
- Add more features from the spec
