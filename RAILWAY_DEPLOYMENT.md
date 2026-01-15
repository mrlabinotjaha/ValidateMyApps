# Railway Deployment Guide

This guide will help you deploy the App Showcase Platform to Railway.

## Prerequisites

- A GitHub account
- A Railway account (sign up at [railway.app](https://railway.app))

## Deployment Steps

### 1. Prepare Your Repository

Make sure all files are committed and pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push
```

### 2. Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your repository

### 3. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

### 4. Configure Environment Variables

In your Railway project, go to the service settings and add these environment variables:

**Required:**
- `SECRET_KEY` - A random secret key for JWT tokens (generate one: `openssl rand -hex 32`)
- `DATABASE_URL` - Automatically set by Railway when you add PostgreSQL

**Optional:**
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (defaults to Railway domain)
- `RAILWAY_VOLUME_MOUNT_PATH` - Path for persistent storage (if you add a volume)

### 5. Configure Service Root Directory (Important!)

**CRITICAL**: Make sure Railway's service root directory is set to the repository root (`.`), not `frontend` or `backend`.

1. Go to your service settings in Railway
2. Scroll to "Root Directory" 
3. Ensure it's set to `.` (project root) or leave it blank

### 6. Set Build and Start Commands

Railway should auto-detect your setup via `nixpacks.toml`, but you can verify in the service settings:

**Start Command (should be auto-detected):**
```bash
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Railway will automatically:
- Detect Python and install dependencies from `backend/requirements.txt`
- Detect Node.js and install frontend dependencies
- Build the frontend and serve it from the backend
- Use the `nixpacks.toml` configuration for the build process

### 7. Add Volume for Uploads (Optional but Recommended)

To persist uploaded images across deployments:

1. In your Railway service, go to "Volumes"
2. Click "Add Volume"
3. Set mount path (e.g., `/data`)
4. Add environment variable: `RAILWAY_VOLUME_MOUNT_PATH=/data`

### 8. Deploy

1. Railway will automatically start building and deploying
2. Once deployed, Railway will provide a public URL (e.g., `yourapp.up.railway.app`)
3. Your app will be live at this URL!

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | Auto-set by Railway |
| `SECRET_KEY` | Yes | Secret key for JWT tokens | None |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins | Auto-configured for Railway |
| `RAILWAY_VOLUME_MOUNT_PATH` | No | Path for persistent file storage | `./uploads` |
| `ALGORITHM` | No | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token expiration time | `43200` (30 days) |

## Post-Deployment

### Initialize Database

The app will automatically create tables on first run. To populate with test data:

1. Go to Railway service → "Connect" → "PostgreSQL"
2. Or use Railway CLI: `railway run python backend/create_mock_data.py`

### Access Your App

- Frontend: `https://your-app.up.railway.app`
- API Health: `https://your-app.up.railway.app/api/health`
- API Docs: `https://your-app.up.railway.app/docs`

## Troubleshooting

### Build Fails

- **Check Service Root Directory**: In Railway service settings, ensure "Root Directory" is set to `.` (project root), not `frontend` or `backend`
- Check that `backend/requirements.txt` exists and is correct
- Verify Node.js version in `package.json` (Railway supports Node 18+)
- Check build logs in Railway dashboard
- If paths are wrong, Railway might be building from a subdirectory - verify the root directory setting

### Database Connection Errors

- Verify `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running
- Railway automatically converts `postgres://` to `postgresql://` for SQLAlchemy

### CORS Errors

- Add your frontend URL to `ALLOWED_ORIGINS` environment variable
- Railway domain is automatically allowed

### Upload Directory Issues

- If using volumes, ensure `RAILWAY_VOLUME_MOUNT_PATH` is set correctly
- Check volume is mounted in Railway dashboard

## Alternative: Separate Services

If you prefer to deploy frontend and backend separately:

### Frontend Service (Static Site)
1. Create new service in Railway
2. Set root directory to `frontend`
3. Build command: `npm ci && npm run build`
4. Start command: `npx serve -s dist -l $PORT`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.up.railway.app/api`

### Backend Service
1. Follow steps above but don't serve frontend
2. Remove frontend serving code from `main.py`
3. Update CORS to allow your frontend URL

## Monitoring

- View logs in Railway dashboard
- Set up monitoring and alerts in Railway
- Check metrics for CPU, memory, and network usage

## Updates

Railway automatically redeploys when you push to your connected branch. To deploy manually:

1. Push to your GitHub repository
2. Railway will detect changes and redeploy automatically

## Support

For Railway-specific issues, check:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

For app-specific issues, refer to the main README.md file.
