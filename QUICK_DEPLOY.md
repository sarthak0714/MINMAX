# Quick Deployment Guide

## 🚀 Deploy Everything in 3 Steps

### Step 1: Deploy to Vercel (Both Backend & Frontend Together)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```
   - Follow prompts (first time: create new project)
   - Project will deploy both backend API and frontend

4. **Get your deployment URL**:
   - Vercel will show: `https://your-project.vercel.app`
   - Save this URL!

### Step 2: Set Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/?appName=minmax
VITE_APP_PASSWORD = your_secure_password
VITE_API_BASE = https://your-project.vercel.app/api
```

**Important**: Replace `your-project.vercel.app` with your actual Vercel URL!

### Step 3: Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

Or click "Redeploy" in Vercel Dashboard.

---

## ✅ That's It!

Your app is now live at: `https://your-project.vercel.app`

- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-project.vercel.app/api`

---

## 🧪 Test It

1. Open your app URL
2. Enter the password (from `VITE_APP_PASSWORD`)
3. Try creating a workout
4. Check if data saves to MongoDB

---

## 🔧 Troubleshooting

**Can't connect to API?**
- Check `VITE_API_BASE` includes `/api` at the end
- Make sure you redeployed after setting env vars

**MongoDB connection fails?**
- Check `MONGODB_URI` is correct
- In MongoDB Atlas, allow all IPs: `0.0.0.0/0` (Network Access)

**Build fails?**
- Check Node.js version in Vercel (should be 18+)
- Check all environment variables are set

---

## 📝 Notes

- The `vercel.json` file is already configured
- Backend and frontend deploy together automatically
- Environment variables are required for the app to work

