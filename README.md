# App Showcase Platform

A full-stack web application for teams to showcase apps in development, gather community feedback through voting and comments, and enable visual feedback directly on app screenshots.

## Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- JWT Authentication
- Alembic (migrations)

### Frontend
- Vite + React + TypeScript
- React Router
- TanStack Query
- Tailwind CSS
- Axios

## Project Structure

```
ValidateMyApps/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── uploads/             # Uploaded images
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── routes/          # React pages
│   │   ├── components/      # Reusable components
│   │   └── lib/             # Utilities and API
│   └── package.json
└── docker-compose.yml
```

## Setup

### Prerequisites
- Docker and Docker Compose
- Python 3.9+
- Node.js 18+

### Backend Setup

1. Start PostgreSQL:
```bash
docker-compose up -d
```

2. Install dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run migrations (when Alembic is set up):
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```
VITE_API_URL=http://localhost:8000/api
```

3. Start the dev server:
```bash
npm run dev
```

## Features Implemented

### Backend
- ✅ User authentication (JWT)
- ✅ App CRUD operations
- ✅ Image upload
- ✅ Voting system
- ✅ Comments with threading
- ✅ Image annotations
- ✅ Tags system

### Frontend
- ✅ Authentication pages (Login/Register)
- ✅ Dashboard with app listing
- 🔄 App detail page (in progress)
- 🔄 App creation form (in progress)
- 🔄 Voting UI (in progress)
- 🔄 Comments UI (in progress)
- 🔄 Image annotations (in progress)
- 🔄 TV mode (in progress)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Apps
- `GET /api/apps` - List apps
- `GET /api/apps/{id}` - Get app details
- `POST /api/apps` - Create app
- `PUT /api/apps/{id}` - Update app
- `DELETE /api/apps/{id}` - Delete app

### Images
- `POST /api/apps/{id}/images` - Upload image
- `DELETE /api/images/{id}` - Delete image

### Votes
- `POST /api/apps/{id}/vote` - Vote on app
- `DELETE /api/apps/{id}/vote` - Remove vote
- `GET /api/apps/{id}/votes` - Get vote stats

### Comments
- `GET /api/apps/{id}/comments` - Get comments
- `POST /api/apps/{id}/comments` - Create comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

### Annotations
- `GET /api/images/{id}/annotations` - Get annotations
- `POST /api/images/{id}/annotations` - Create annotation
- `PUT /api/annotations/{id}` - Update annotation
- `DELETE /api/annotations/{id}` - Delete annotation
- `PATCH /api/annotations/{id}/resolve` - Resolve annotation

## Development Notes

- Backend uses Pydantic v2 syntax
- Frontend uses React Router (simplified from TanStack Router for faster setup)
- Image uploads stored locally in `backend/uploads/`
- Database migrations need to be set up with Alembic

## Creating Mock Data

To populate the database with test data for UI testing:

```bash
cd backend
python create_mock_data.py
```

This creates:
- 4 test users (admin, alice, bob, viewer1)
- 6 sample apps
- Votes and comments
- Tags

**Test Users:**
- `admin` / `admin123` (Admin)
- `alice` / `password123` (Developer)
- `bob` / `password123` (Developer)
- `viewer1` / `password123` (Viewer)

## Next Steps

1. ✅ Create mock data script
2. ✅ Complete comments UI
3. Complete image annotations UI
4. Set up Alembic migrations
5. Add WebSocket support for real-time updates
6. Implement TV display mode
7. Add error boundaries and loading states
8. Implement user profiles
9. Style improvements
