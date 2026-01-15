# How to Run the App

## Quick Start (3 Steps)

### 1. Start Database

```bash
docker-compose up -d
```

Wait a few seconds for PostgreSQL to start.

### 2. Start Backend

Open a terminal and run:

```bash
cd backend

# Create virtual environment (first time only)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Create .env file (first time only)
cat > .env << EOF
DATABASE_URL=postgresql://appshowcase:appshowcase@localhost:5432/appshowcase
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:5173
EOF

# Create mock data (first time only, or to reset)
python create_mock_data.py

# Start the server
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**

### 3. Start Frontend

Open a **new terminal** and run:

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Create .env file (first time only)
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Start the dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

## Test the App

1. Open **http://localhost:5173** in your browser
2. Try logging in:
   - Username: `alice` / Password: `password123`
   - Username: `admin` / Password: `admin123`
3. Browse apps, vote, comment, and create new apps!

## Test Users

- `admin` / `admin123` - Admin
- `alice` / `password123` - Developer  
- `bob` / `password123` - Developer
- `viewer1` / `password123` - Viewer

## Stopping the App

- **Backend**: Press `Ctrl+C` in the backend terminal
- **Frontend**: Press `Ctrl+C` in the frontend terminal  
- **Database**: `docker-compose down` (optional)

## Troubleshooting

**Database connection error?**
```bash
# Check if PostgreSQL is running
docker ps

# Restart database
docker-compose restart
```

**Port already in use?**
- Backend: Change to `--port 8001` in uvicorn command
- Frontend: Vite will auto-use next available port

**Module not found errors?**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

**Frontend can't connect to API?**
- Check backend is running at http://localhost:8000
- Verify `.env` file in frontend has correct API URL
