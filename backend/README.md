# Backend Setup Guide

## Prerequisites

1. **Python 3.8+** installed
2. **PostgreSQL** database running
3. **pip** (Python package manager)

## Setup Steps

### 1. Create a Virtual Environment (Recommended)

```bash
cd backend
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SECRET_KEY=your-secret-key-here-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=["http://localhost:5173"]
```

**Example `.env` file:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/validatemyapps
SECRET_KEY=super-secret-key-change-this-in-production-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=["http://localhost:5173"]
```

**To generate a secure SECRET_KEY:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 4. Set Up PostgreSQL Database

Make sure PostgreSQL is running and create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE validatemyapps;

# Exit psql
\q
```

### 5. Create Uploads Directory

```bash
mkdir -p uploads
```

### 6. Run the Server

```bash
# From the backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/api/health

### 7. (Optional) Create Initial Data

If you want to populate the database with mock data:

```bash
python create_mock_data.py
```

## Database Tables

The following tables will be automatically created when you first run the server:
- `users`
- `apps`
- `images`
- `tags`
- `app_tags`
- `votes`
- `comments`
- `annotations`
- `projects` (NEW)
- `project_members` (NEW)
- `project_todos` (NEW)

## API Endpoints

### Projects (NEW)
- `GET /api/projects` - List projects
- `GET /api/projects/public` - List public projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `GET/POST /api/projects/{id}/todos` - Manage todos
- `PUT/DELETE /api/projects/{id}/todos/{todo_id}` - Update/delete todos
- `GET/POST/DELETE /api/projects/{id}/members` - Manage members

### Other Endpoints
- See http://localhost:8000/docs for full API documentation

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running
- Check that the `DATABASE_URL` in `.env` is correct
- Verify the database exists

### Port Already in Use
- Change the port: `uvicorn app.main:app --reload --port 8001`
- Or kill the process using port 8000

### Import Errors
- Make sure you're in the virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`

### CORS Errors
- Check that `ALLOWED_ORIGINS` in `.env` includes your frontend URL
