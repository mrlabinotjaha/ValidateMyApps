# Image Storage Information

## Where Images Are Stored

Images are stored in the **`./uploads`** directory (relative to the backend root directory).

### Default Location

- **Path**: `/Users/labinotjaha/Desktop/ValidateMyApps/backend/uploads/`
- **URL**: Images are served at `http://localhost:8000/uploads/{filename}`

### Configuration

The upload directory can be configured via the `UPLOAD_DIR` environment variable in `backend/.env`:

```
UPLOAD_DIR=./uploads
```

### How It Works

1. **Upload Process**:

   - User uploads an image through the frontend
   - Backend validates the image (type, size, format)
   - Image is saved with a unique UUID filename (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`)
   - Database stores the relative path: `/uploads/{filename}`
   - Image is served statically via FastAPI's StaticFiles

2. **File Storage**:

   - Images are stored directly on the filesystem
   - Each image gets a unique UUID-based filename to prevent conflicts
   - Original filenames are not preserved for security

3. **Supported Formats**:

   - `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
   - Maximum file size: 10MB

4. **Serving Images**:
   - Backend mounts `/uploads` endpoint to serve files
   - Frontend accesses images via: `http://localhost:8000/uploads/{filename}`

### Important Notes

- The `uploads` directory is automatically created if it doesn't exist
- Images are only associated with **Apps** (not Projects)
- Only app owners can upload/delete images for their apps
- Images are permanently deleted when an app is deleted (cascade)

### For Production

In production, consider:

- Using cloud storage (AWS S3, Google Cloud Storage, etc.)
- Setting up proper backup strategies
- Configuring CDN for faster image delivery
- Implementing image optimization/resizing
