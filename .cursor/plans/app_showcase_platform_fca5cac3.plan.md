---
name: App Showcase Platform
overview: Build a full-stack app showcase platform with Vite+React frontend and FastAPI backend, featuring app submissions, voting, comments, image annotations, and TV display mode.
todos:
  - id: setup-docker-postgres
    content: Create docker-compose.yml with PostgreSQL container
    status: completed
  - id: setup-backend
    content: Initialize FastAPI backend with project structure, config, and database setup
    status: completed
  - id: backend-auth
    content: Implement User model, JWT auth endpoints (register, login, refresh, me)
    status: completed
  - id: setup-frontend
    content: Initialize Vite + React + TypeScript with TanStack Router and Query
    status: completed
  - id: frontend-shadcn
    content: Set up shadcn/ui and Tailwind CSS with custom theme
    status: completed
  - id: frontend-auth
    content: Build auth context, protected routes, login/register pages
    status: completed
  - id: backend-apps
    content: Create App, Image, Tag models and CRUD API endpoints
    status: completed
  - id: backend-upload
    content: Implement image upload service with local storage
    status: completed
  - id: frontend-dashboard
    content: Build dashboard with AppCard grid, filtering, and sorting
    status: completed
  - id: frontend-app-form
    content: Create AppForm with React Dropzone for image upload
    status: completed
  - id: frontend-app-detail
    content: Build app detail page with image carousel
    status: completed
  - id: backend-voting
    content: Create Vote model and voting API endpoints
    status: completed
  - id: backend-comments
    content: Create Comment model with threading and CRUD endpoints
    status: completed
  - id: frontend-voting
    content: Build VoteButtons component with optimistic updates
    status: completed
  - id: frontend-comments
    content: Create CommentSection with threaded display and markdown
    status: completed
  - id: backend-annotations
    content: Create Annotation model and API endpoints
    status: completed
  - id: frontend-annotations
    content: Build ImageAnnotation component with Fabric.js canvas
    status: completed
  - id: backend-websocket
    content: Implement WebSocket for real-time updates
    status: completed
  - id: frontend-tv-mode
    content: Create TV display mode with auto-rotation carousel
    status: completed
  - id: polish
    content: Add error boundaries, loading states, search, and user profiles
    status: completed
---

# App Showcase Platform - Implementation Plan

## Architecture Overview

```mermaid
flowchart TB
    subgraph frontend [Frontend - Vite + React]
        Router[TanStack Router]
        Query[TanStack Query]
        UI[shadcn/ui Components]
        Canvas[Fabric.js Annotations]
    end

    subgraph backend [Backend - FastAPI]
        Auth[JWT Auth]
        API[REST API]
        WS[WebSocket Handler]
        Upload[File Upload Service]
    end

    subgraph storage [Storage]
        PG[(PostgreSQL)]
        Files[Local/S3 Storage]
    end

    frontend --> API
    frontend --> WS
    API --> PG
    Upload --> Files
    Auth --> PG
```

## Project Structure

```
ValidateMyApps/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   └── utils/
│   ├── uploads/
│   ├── requirements.txt
│   └── alembic/
├── frontend/
│   ├── src/
│   │   ├── routes/
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## Phase 1: Project Setup and Authentication

### 1.1 Backend Foundation

- Initialize FastAPI project with proper structure
- Set up PostgreSQL with Docker Compose
- Configure SQLAlchemy ORM and Alembic migrations
- Create User model with roles (developer, viewer, admin)
- Implement JWT authentication (register, login, refresh, me endpoints)
- Set up CORS and security middleware

### 1.2 Frontend Foundation

- Initialize Vite + React + TypeScript project
- Install and configure TanStack Router with file-based routing
- Install and configure TanStack Query
- Set up shadcn/ui with Tailwind CSS
- Create auth context and protected routes
- Build login/register pages with form validation

---

## Phase 2: Core App Submission and Display

### 2.1 Backend - Apps API

- Create App, Image, Tag models with relationships
- Implement CRUD endpoints for apps
- Build image upload service (local storage initially)
- Add pagination, filtering, and sorting to list endpoint
- Implement draft/publish functionality

### 2.2 Frontend - App Management

- Create `AppCard` component for grid display
- Build responsive dashboard with filtering/sorting controls
- Implement `AppForm` for creating/editing apps
- Add React Dropzone for drag-and-drop image upload
- Create app detail page with image carousel

---

## Phase 3: Voting and Comments

### 3.1 Backend - Voting System

- Create Vote model with unique constraint (user + app)
- Implement vote endpoints (cast, change, remove)
- Add vote aggregation to app queries
- Set up WebSocket for real-time vote updates

### 3.2 Backend - Comments System

- Create Comment model with self-referential FK for threading
- Implement CRUD endpoints for comments
- Add comment count to app queries

### 3.3 Frontend - Interactions

- Build `VoteButtons` component with optimistic updates
- Create `CommentSection` with threaded display
- Add reply functionality and markdown rendering
- Implement real-time updates via WebSocket

---

## Phase 4: Image Annotation System

### 4.1 Backend - Annotations

- Create Annotation model with coordinates and status
- Implement CRUD endpoints for annotations
- Add resolve/archive functionality

### 4.2 Frontend - Canvas Annotations

- Integrate Fabric.js for canvas overlay
- Build `ImageAnnotation` component with:
  - Click to add point markers
  - Draw rectangles/circles for highlighting
  - Annotation list sidebar with comments
- Implement annotation filtering (open/resolved)

---

## Phase 5: TV Display Mode and Polish

### 5.1 TV Mode Features

- Create fullscreen TV route with auto-rotation
- Build activity feed component
- Make view-only mode without authentication
- Add configurable rotation interval

### 5.2 Real-time Updates

- Implement WebSocket broadcast for:
  - New app submissions
  - Vote changes
  - New comments
- Add toast notifications for activity

### 5.3 Polish and Optimization

- Add loading states and error boundaries
- Implement image optimization and lazy loading
- Add search functionality with debouncing
- Create user profile pages

---

## Key Implementation Details

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB

    User->>Frontend: Login credentials
    Frontend->>API: POST /api/auth/login
    API->>DB: Verify user
    DB-->>API: User data
    API-->>Frontend: JWT tokens
    Frontend->>Frontend: Store in localStorage
    Frontend-->>User: Redirect to dashboard
```

### Database Models

```mermaid
erDiagram
    Users ||--o{ Apps : creates
    Users ||--o{ Votes : casts
    Users ||--o{ Comments : writes
    Users ||--o{ Annotations : creates
    Apps ||--o{ Images : has
    Apps ||--o{ Votes : receives
    Apps ||--o{ Comments : has
    Apps }o--o{ Tags : tagged_with
    Images ||--o{ Annotations : has
    Comments ||--o{ Comments : replies_to

    Users {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        string avatar_url
        enum role
        datetime created_at
    }

    Apps {
        uuid id PK
        string name
        string short_description
        text full_description
        uuid creator_id FK
        enum status
        boolean is_published
        datetime created_at
        datetime updated_at
    }

    Images {
        uuid id PK
        uuid app_id FK
        string image_url
        boolean is_featured
        int order_index
    }

    Votes {
        uuid id PK
        uuid app_id FK
        uuid user_id FK
        enum vote_type
        datetime created_at
    }

    Comments {
        uuid id PK
        uuid app_id FK
        uuid user_id FK
        uuid parent_id FK
        text content
        datetime created_at
    }

    Annotations {
        uuid id PK
        uuid image_id FK
        uuid user_id FK
        decimal x_position
        decimal y_position
        decimal width
        decimal height
        enum annotation_type
        text comment
        enum status
    }

    Tags {
        uuid id PK
        string name UK
    }
```

---

## Key Files to Create

### Backend Core Files

| File | Purpose |

|------|---------|

| `backend/app/main.py` | FastAPI app entry point, CORS, routers |

| `backend/app/config.py` | Environment variables and settings |

| `backend/app/database.py` | SQLAlchemy engine and session |

| `backend/app/models/*.py` | SQLAlchemy ORM models |

| `backend/app/schemas/*.py` | Pydantic request/response schemas |

| `backend/app/routers/*.py` | API route handlers |

| `backend/app/services/auth.py` | JWT token generation and validation |

| `backend/app/services/upload.py` | File upload handling |

| `backend/app/utils/dependencies.py` | FastAPI dependencies (get_current_user) |

### Frontend Core Files

| File | Purpose |

|------|---------|

| `frontend/src/main.tsx` | React entry point |

| `frontend/src/routeTree.gen.ts` | TanStack Router generated routes |

| `frontend/src/routes/__root.tsx` | Root layout with navbar |

| `frontend/src/routes/index.tsx` | Home/dashboard page |

| `frontend/src/routes/login.tsx` | Login page |

| `frontend/src/routes/apps/$id.tsx` | App detail page |

| `frontend/src/routes/apps/new.tsx` | New app form |

| `frontend/src/routes/tv-mode.tsx` | TV display mode |

| `frontend/src/lib/api.ts` | API client with axios |

| `frontend/src/lib/auth.ts` | Auth context and hooks |

| `frontend/src/components/AppCard.tsx` | App card for grid display |

| `frontend/src/components/VoteButtons.tsx` | Voting UI component |

| `frontend/src/components/CommentSection.tsx` | Threaded comments |

| `frontend/src/components/ImageAnnotation.tsx` | Fabric.js annotation canvas |

---

## Tech Stack Summary

| Layer | Technology | Version |

|-------|------------|---------|

| Frontend Framework | Vite + React | 5.x + 18.x |

| Frontend Routing | TanStack Router | 1.x |

| Server State | TanStack Query | 5.x |

| UI Components | shadcn/ui | latest |

| Styling | Tailwind CSS | 3.x |

| Image Upload | React Dropzone | 14.x |

| Canvas Annotations | Fabric.js | 6.x |

| Backend Framework | FastAPI | 0.100+ |

| ORM | SQLAlchemy | 2.x |

| Database | PostgreSQL | 15+ |

| Auth | python-jose (JWT) | 3.x |

| Migrations | Alembic | 1.x |

---

## Environment Setup

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: appshowcase
      POSTGRES_PASSWORD: appshowcase
      POSTGRES_DB: appshowcase
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Backend .env

```
DATABASE_URL=postgresql://appshowcase:appshowcase@localhost:5432/appshowcase
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
UPLOAD_DIR=./uploads
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend .env

```
VITE_API_URL=http://localhost:8000/api
```

---

## Getting Started Commands

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

---

## Implementation Order

1. **Docker + Backend skeleton** - Get database and FastAPI running
2. **Auth system** - Users can register and login
3. **Frontend skeleton** - Vite app with routing and auth pages
4. **Apps CRUD** - Submit and view apps
5. **Voting** - Upvote/downvote functionality
6. **Comments** - Threaded discussion
7. **Annotations** - Visual feedback on images
8. **TV Mode** - Display mode for office screens
9. **Polish** - Real-time updates, search, profiles
