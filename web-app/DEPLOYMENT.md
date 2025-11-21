# Deployment Guide

This guide walks you through deploying the MINMAX app backend and frontend separately, then connecting them.

## Prerequisites

- MongoDB Atlas account (free tier works)
- Vercel account (free tier works)
- Node.js installed locally
- Git repository set up

---

## Part 1: Deploy Backend to Vercel

### Step 1: Prepare Backend for Deployment

1. **Create `vercel.json` in the root directory**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Install Vercel CLI** (if not already installed):

```bash
npm i -g vercel
```

### Step 2: Deploy Backend

1. **Login to Vercel**:

```bash
vercel login
```

2. **Navigate to your project root** and deploy:

```bash
vercel
```

3. **Follow the prompts**:

   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No** (first time) or **Yes** (if updating)
   - Project name: `minmax-backend` (or your choice)
   - Directory: `./` (current directory)
   - Override settings? **No**

4. **Set Environment Variables**:

After deployment, go to [Vercel Dashboard](https://vercel.com/dashboard):

- Click on your project
- Go to **Settings** → **Environment Variables**
- Add:
  - `MONGODB_URI` = `mongodb+srv://username:password@cluster.mongodb.net/?appName=minmax`
  - `NODE_ENV` = `production`

5. **Redeploy** after adding env vars:

```bash
vercel --prod
```

6. **Copy your backend URL**:
   - After deployment, Vercel will show: `https://your-project.vercel.app`
   - Your API will be at: `https://your-project.vercel.app/api`
   - **Save this URL** - you'll need it for the frontend!

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Create `vercel.json` for frontend** (if deploying separately):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Set Environment Variables

Create a `.env.production` file (or set in Vercel Dashboard):

```env
VITE_APP_PASSWORD=your_secure_password_here
VITE_API_BASE=https://your-backend-project.vercel.app/api
```

**Important**: Replace `your-backend-project.vercel.app` with your actual backend URL from Part 1!

### Step 3: Deploy Frontend

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New Project**
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (or leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Add Environment Variables**:
   - `VITE_APP_PASSWORD` = your password
   - `VITE_API_BASE` = `https://your-backend-project.vercel.app/api`
6. Click **Deploy**

**Option B: Via CLI**

```bash
# In your project root
vercel --prod
```

Follow prompts and set environment variables in Vercel Dashboard after first deploy.

---

## Part 3: Connect Frontend to Backend

### Step 1: Update Frontend Environment Variable

1. Go to **Vercel Dashboard** → Your frontend project
2. **Settings** → **Environment Variables**
3. Update `VITE_API_BASE`:
   ```
   VITE_API_BASE=https://your-backend-project.vercel.app/api
   ```
4. **Redeploy** frontend (Vercel will auto-redeploy on next push, or click "Redeploy" in dashboard)

### Step 2: Verify Connection

1. Open your deployed frontend URL
2. Enter password (from `VITE_APP_PASSWORD`)
3. Try creating a workout
4. Check browser console for any API errors

### Step 3: Test API Endpoints

Test your backend directly:

```bash
# List exercises
curl https://your-backend-project.vercel.app/api/exercises

# Create a workout (example)
curl -X POST https://your-backend-project.vercel.app/api/workouts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "single",
    "date": "2024-01-15",
    "exercises": []
  }'
```

---

## Alternative: Deploy Both Together (Monorepo)

If you want to deploy both backend and frontend from the same Vercel project:

### Step 1: Create Combined `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### Step 2: Update `package.json` Build Script

Add this to your `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "npm run build"
  }
}
```

### Step 3: Deploy

```bash
vercel --prod
```

Set all environment variables in Vercel Dashboard:

- `MONGODB_URI`
- `VITE_APP_PASSWORD`
- `VITE_API_BASE` (can be relative: `/api` or full URL)

---

## Troubleshooting

### Backend Issues

**Problem**: API returns 404

- **Solution**: Check `vercel.json` routes are correct
- **Solution**: Ensure `server/index.ts` exports the Express app correctly

**Problem**: MongoDB connection fails

- **Solution**: Check `MONGODB_URI` is set correctly in Vercel
- **Solution**: Whitelist Vercel IPs in MongoDB Atlas (or allow all IPs: `0.0.0.0/0`)

**Problem**: CORS errors

- **Solution**: Check CORS is enabled in `server/index.ts`
- **Solution**: Verify frontend URL is allowed in CORS config

### Frontend Issues

**Problem**: Can't connect to API

- **Solution**: Check `VITE_API_BASE` is set correctly
- **Solution**: Ensure backend URL includes `/api` at the end
- **Solution**: Check browser console for exact error

**Problem**: Environment variables not working

- **Solution**: Vite env vars must start with `VITE_`
- **Solution**: Rebuild after changing env vars: `npm run build`
- **Solution**: Clear browser cache

**Problem**: Build fails

- **Solution**: Check Node.js version in Vercel (should be 18+)
- **Solution**: Check `package.json` has correct build script

---

## Quick Reference

### Backend URL Format

```
https://your-project.vercel.app/api
```

### Frontend Environment Variables

```env
VITE_APP_PASSWORD=your_password
VITE_API_BASE=https://your-backend.vercel.app/api
```

### Backend Environment Variables

```env
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

### Useful Commands

```bash
# Deploy backend
vercel --prod

# Deploy frontend
vercel --prod

# View deployment logs
vercel logs

# Check environment variables
vercel env ls
```

---

## Next Steps

1. ✅ Backend deployed and accessible
2. ✅ Frontend deployed and accessible
3. ✅ Environment variables set correctly
4. ✅ Frontend can call backend API
5. ✅ Test creating workouts and exercises

Your app should now be fully deployed and connected! 🚀
