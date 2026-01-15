# Railway Deployment Checklist

## ✅ Files Created/Updated

### Configuration Files
- ✅ `railway.json` - Railway project configuration
- ✅ `nixpacks.toml` - Build configuration for Railway
- ✅ `Procfile` - Process file for Railway
- ✅ `.railwayignore` - Files to exclude from Railway builds
- ✅ `backend/runtime.txt` - Python version specification

### Scripts
- ✅ `backend/start.sh` - Backend startup script (with migration support)
- ✅ `build.sh` - Frontend build script

### Code Updates
- ✅ `backend/app/main.py` - Updated to serve frontend static files
- ✅ `backend/app/config.py` - Updated to handle Railway environment variables
- ✅ `frontend/src/lib/api.ts` - Updated to use relative URLs in production

### Documentation
- ✅ `RAILWAY_DEPLOYMENT.md` - Complete deployment guide

## 🚀 Quick Start Steps

1. **Push to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push
   ```

2. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - New Project → Deploy from GitHub
   - Select your repository

3. **Add PostgreSQL**
   - Click "+ New" → Database → PostgreSQL
   - `DATABASE_URL` will be auto-set

4. **Set Environment Variables**
   - `SECRET_KEY` - Generate with: `openssl rand -hex 32`
   - (Optional) `ALLOWED_ORIGINS` - If deploying frontend separately
   - (Optional) `RAILWAY_VOLUME_MOUNT_PATH` - If using volumes for uploads

5. **Deploy!**
   - Railway will auto-detect and build
   - Your app will be live at `yourapp.up.railway.app`

## 📋 Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub
- [ ] `SECRET_KEY` generated and ready to add
- [ ] Railway account created
- [ ] GitHub repo is public or Railway has access

## 🔍 Post-Deployment Checks

- [ ] App loads at Railway URL
- [ ] API health endpoint works: `/api/health`
- [ ] Can register/login
- [ ] Can upload images
- [ ] Database tables created (check logs)
- [ ] Frontend routing works (try navigating)

## 🐛 Common Issues

### Build Fails
- Check Railway build logs
- Verify `requirements.txt` is correct
- Ensure Node.js version is compatible

### Database Connection Error
- Verify `DATABASE_URL` is set
- Check PostgreSQL service is running
- Database URL should use `postgresql://` (Railway auto-converts)

### CORS Errors
- Add your frontend URL to `ALLOWED_ORIGINS`
- Or ensure frontend is served from same domain (current setup)

### 404 on Routes
- Verify frontend build is in `backend/static/`
- Check that `static/index.html` exists
- Verify route order in `main.py` (API routes before catch-all)

## 📚 Additional Resources

- See `RAILWAY_DEPLOYMENT.md` for detailed guide
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
