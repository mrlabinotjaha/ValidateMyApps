# Running Frontend with Mock Data

To test the UI without running the backend, you can use mock data mode.

## Quick Start

1. **Create/update `.env` file in the frontend directory:**
   ```bash
   cd frontend
   echo "VITE_USE_MOCK=true" > .env
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:5173 in your browser**

## What Works in Mock Mode

✅ **Dashboard** - Browse 5 sample apps
✅ **App Detail Pages** - View app details, images, tags
✅ **Voting** - Vote on apps (upvote/downvote)
✅ **Comments** - View and add comments (threaded)
✅ **Authentication** - Login works (any username/password)
✅ **Navigation** - All routes work

## Mock Data

The mock data includes:
- 5 sample apps with images
- Votes and vote counts
- Comments with replies
- Tags and categories

## Switching Back to Real API

To use the real backend API, change your `.env` file:
```bash
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000/api
```

Or remove `VITE_USE_MOCK` entirely.

## Notes

- In mock mode, authentication is always "logged in" as "alice"
- Voting and commenting work but data is stored in memory (resets on refresh)
- Images use placeholder URLs from via.placeholder.com
- All API calls are simulated with ~200-300ms delay
