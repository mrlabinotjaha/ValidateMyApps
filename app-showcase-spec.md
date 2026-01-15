# App Showcase Platform - Technical Specification

## Project Overview
A collaborative web application for teams to showcase apps in development, gather community feedback through voting and comments, and enable visual feedback directly on app screenshots.

## Core Purpose
- Display apps being developed by team members on office TVs
- Enable community-driven feedback through upvoting/downvoting
- Allow detailed comments on projects
- Support visual annotation on screenshots
- Potentially sellable to other offices/teams

## Tech Stack

### Frontend
- **Framework**: TanStack Start (React-based meta-framework)
- **Styling**: shadcn/ui (Tailwind-based component library)
- **State Management**: TanStack Query for server state
- **Routing**: TanStack Router (built into TanStack Start)

### Backend
- **API Framework**: FastAPI (Python)
- **Database**: PostgreSQL (recommended for production)
- **Authentication**: JWT-based auth
- **File Storage**: Local storage or S3-compatible service for images

### Additional Libraries
- **Image Upload**: React Dropzone
- **Image Annotation**: Fabric.js or Konva.js for canvas-based annotations
- **Real-time Updates**: WebSockets (FastAPI WebSocket support)

## Feature Requirements

### 1. Authentication & User Management
- User registration and login
- Each user has their own profile
- JWT token-based authentication
- User roles: Developer (can create apps), Viewer (can only vote/comment)

### 2. App Submission
**Form Fields:**
- App name (required)
- Short description (required, ~100-200 chars)
- Detailed description (optional, rich text)
- Image upload (required, multiple images supported)
- Creator (auto-filled from logged-in user)
- Tags/categories (optional)
- Status: In Development, Beta, Completed

**Functionality:**
- Drag-and-drop image upload
- Image preview before submission
- Edit/delete own submissions
- Draft mode (save without publishing)

### 3. Dashboard/Feed View
**Layout:**
- Grid or card-based layout showing all apps
- Each card displays:
  - Featured image
  - App name
  - Creator name
  - Short description
  - Upvote/downvote count (net score)
  - Comment count
  - Date submitted

**Features:**
- Sorting: Most recent, Most upvoted, Most controversial
- Filtering: By creator, by status, by tags
- Search functionality
- Optimized for TV display (responsive, high contrast)

### 4. Voting System
- Upvote/downvote mechanism (one vote per user per app)
- Display net vote count
- Visual indicator if user has voted
- Ability to change vote
- Real-time vote count updates

### 5. App Detail Page
**Sections:**
- Hero image carousel
- Full description
- Creator information
- Voting buttons (prominent)
- Vote count and percentage
- Creation/last updated date
- Tags/categories

**Comments Section:**
- Threaded comments
- Reply functionality
- Vote on comments (optional)
- Sort by: Newest, Oldest, Most upvoted
- Markdown support in comments

### 6. Image Annotation System
**Core Features:**
- Click to add annotation markers on images
- Draw rectangles/circles to highlight areas
- Each annotation has:
  - Visual marker (numbered or color-coded)
  - Associated comment/text
  - Creator name
  - Timestamp
- Ability to resolve/archive annotations
- Filter annotations by status (open/resolved)

**Implementation Approach:**
- Use canvas overlay on images
- Store annotation coordinates in database
- Link annotations to specific images
- Allow annotation creators to edit/delete their annotations

### 7. TV Display Mode
- Auto-rotating carousel of top apps
- Fullscreen mode
- Configurable rotation interval
- Display recent activity feed
- No login required for view-only mode

## Database Schema

### Users Table
```sql
- id (PK)
- username (unique)
- email (unique)
- password_hash
- full_name
- avatar_url
- role (enum: developer, viewer, admin)
- created_at
- updated_at
```

### Apps Table
```sql
- id (PK)
- name
- short_description
- full_description
- creator_id (FK -> Users)
- status (enum: in_development, beta, completed)
- created_at
- updated_at
- is_published (boolean)
```

### Images Table
```sql
- id (PK)
- app_id (FK -> Apps)
- image_url
- is_featured (boolean)
- order_index
- created_at
```

### Votes Table
```sql
- id (PK)
- app_id (FK -> Apps)
- user_id (FK -> Users)
- vote_type (enum: upvote, downvote)
- created_at
- updated_at
- UNIQUE(app_id, user_id)
```

### Comments Table
```sql
- id (PK)
- app_id (FK -> Apps)
- user_id (FK -> Users)
- parent_comment_id (FK -> Comments, nullable for threaded comments)
- content
- created_at
- updated_at
```

### Annotations Table
```sql
- id (PK)
- image_id (FK -> Images)
- user_id (FK -> Users)
- x_position (decimal)
- y_position (decimal)
- width (decimal, nullable for point annotations)
- height (decimal, nullable for point annotations)
- annotation_type (enum: rectangle, circle, point)
- comment
- status (enum: open, resolved)
- created_at
- updated_at
```

### Tags Table
```sql
- id (PK)
- name (unique)
```

### AppTags Table (junction)
```sql
- app_id (FK -> Apps)
- tag_id (FK -> Tags)
- PRIMARY KEY (app_id, tag_id)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### Apps
- `GET /api/apps` - List all apps (with filters, sorting, pagination)
- `GET /api/apps/{id}` - Get single app with details
- `POST /api/apps` - Create new app (auth required)
- `PUT /api/apps/{id}` - Update app (auth required, owner only)
- `DELETE /api/apps/{id}` - Delete app (auth required, owner only)

### Images
- `POST /api/apps/{id}/images` - Upload image to app
- `DELETE /api/images/{id}` - Delete image (auth required, owner only)
- `PUT /api/images/{id}/order` - Reorder images

### Votes
- `POST /api/apps/{id}/vote` - Upvote or downvote (toggle if already voted)
- `DELETE /api/apps/{id}/vote` - Remove vote
- `GET /api/apps/{id}/votes` - Get vote statistics

### Comments
- `GET /api/apps/{id}/comments` - Get all comments for an app
- `POST /api/apps/{id}/comments` - Add comment (auth required)
- `PUT /api/comments/{id}` - Edit comment (auth required, owner only)
- `DELETE /api/comments/{id}` - Delete comment (auth required, owner only)

### Annotations
- `GET /api/images/{id}/annotations` - Get all annotations for an image
- `POST /api/images/{id}/annotations` - Add annotation (auth required)
- `PUT /api/annotations/{id}` - Edit annotation (auth required, owner only)
- `DELETE /api/annotations/{id}` - Delete annotation (auth required, owner only)
- `PATCH /api/annotations/{id}/resolve` - Mark annotation as resolved

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag (auth required)

## File Structure

```
project-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── app.py
│   │   │   ├── vote.py
│   │   │   ├── comment.py
│   │   │   └── annotation.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── app.py
│   │   │   ├── vote.py
│   │   │   ├── comment.py
│   │   │   └── annotation.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── apps.py
│   │   │   ├── votes.py
│   │   │   ├── comments.py
│   │   │   └── annotations.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── upload.py
│   │   │   └── vote.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── security.py
│   │       └── dependencies.py
│   ├── uploads/
│   ├── requirements.txt
│   └── alembic/ (for database migrations)
│
├── frontend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── __root.tsx
│   │   │   ├── index.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── apps/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── new.tsx
│   │   │   │   └── $id.tsx
│   │   │   └── tv-mode.tsx
│   │   ├── components/
│   │   │   ├── ui/ (shadcn components)
│   │   │   ├── AppCard.tsx
│   │   │   ├── AppForm.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── VoteButtons.tsx
│   │   │   ├── ImageAnnotation.tsx
│   │   │   └── Navbar.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useApps.ts
│   │       └── useVotes.ts
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
1. Authentication system
2. Basic app submission (name, description, single image)
3. Dashboard display
4. Simple voting (upvote/downvote)
5. Basic comments

### Phase 2: Enhanced Features
1. Multiple image upload
2. Image carousel
3. Threaded comments
4. Filtering and sorting
5. User profiles

### Phase 3: Visual Annotations
1. Image annotation system
2. Annotation comments
3. Resolve/archive annotations

### Phase 4: TV Mode & Polish
1. TV display mode
2. Real-time updates
3. Analytics dashboard
4. Admin panel
5. Performance optimization

## Deployment Considerations

### Development
- Frontend: `npm run dev` (Vite dev server)
- Backend: `uvicorn app.main:app --reload`

### Production
- Frontend: Build static files, serve via CDN or Nginx
- Backend: Deploy FastAPI with Gunicorn/Uvicorn workers
- Database: Managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- File Storage: S3 or similar for images
- Containerization: Docker & Docker Compose

### Environment Variables
```
# Backend
DATABASE_URL=postgresql://user:pass@localhost/dbname
SECRET_KEY=your-secret-key
UPLOAD_DIR=/path/to/uploads
ALLOWED_ORIGINS=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8000/api
```

## Security Considerations
- CSRF protection
- Rate limiting on API endpoints
- Input validation and sanitization
- Image file type validation
- File size limits
- SQL injection prevention (use ORM)
- XSS prevention
- Secure password hashing (bcrypt)

## Scalability for Multi-Tenancy (Future)
- Add `organization_id` to relevant tables
- Subdomain or path-based routing per organization
- Separate databases per tenant or shared schema with tenant isolation
- Organization-level settings and branding

## Success Metrics
- Number of apps submitted
- Engagement rate (votes, comments per app)
- Active users
- Average time on platform
- Annotation usage rate

---

**Next Steps:**
1. Set up development environment
2. Initialize TanStack Start and FastAPI projects
3. Configure database and run initial migrations
4. Implement authentication system
5. Build core app submission and display features
6. Iterate based on user feedback