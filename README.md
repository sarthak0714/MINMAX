# MINMAX - Fitness Workout Tracker

A modern fitness tracking application built with React, TypeScript, Express, and MongoDB. Track your workouts, monitor progress with visual volume graphs, and analyze exercise performance over time.

## Features

- 📊 **Volume Visualization**: Interactive calendar heatmap and week timeline showing workout volume (sets × weight)
- 🏋️ **Workout Management**: Create, edit, and track workouts with exercises, sets, reps, and weights
- 📈 **Progress Tracking**: Per-exercise comparisons showing volume and reps changes over time
- 🔐 **Password Authentication**: Simple password-based auth with 24-hour session expiry
- 💾 **MongoDB Backend**: Express.js API with Mongoose for data persistence
- 🎨 **Modern UI**: Glassmorphism design with smooth animations

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas
- **Deployment**: Vercel (serverless functions)

## Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <repository-url>
cd MINMAX
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=minmax

# App Password (for authentication)
VITE_APP_PASSWORD=your_secure_password_here

# API Base URL (for production, set to your Vercel deployment URL)
VITE_API_BASE=https://your-app.vercel.app/api
```

**Note**: For local development, the API base defaults to `http://localhost:3001/api`.

### 3. Backend Setup

The backend is located in the `server/` directory:

```bash
# Run backend locally (development)
npm run dev:server

# Or run backend in production mode
npm run server
```

The backend will start on `http://localhost:3001` by default.

### 4. Seed Exercises

Populate the database with initial exercise data:

```bash
npx tsx scripts/backfill-exercises.ts
```

This script reads from `src/items/exersise.json` and upserts exercises into MongoDB.

### 5. Frontend Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
MINMAX/
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx      # Password authentication screen
│   │   ├── WorkoutsPage.tsx    # Main workouts page with volume graph
│   │   ├── VolumeBubbles.tsx   # Calendar heatmap component
│   │   ├── AddWorkoutDrawer.tsx # Workout creation/editing drawer
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts             # Authentication utilities
│   │   └── workouts.ts         # API client for workouts/exercises
│   └── App.tsx                 # Main app component
├── server/
│   ├── index.ts                # Express app entry point
│   ├── db.ts                   # MongoDB connection
│   ├── models/
│   │   ├── Exercise.ts         # Exercise Mongoose model
│   │   └── Workout.ts          # Workout Mongoose model
│   ├── routes/
│   │   ├── exercises.ts         # Exercise API routes
│   │   └── workouts.ts          # Workout API routes
│   └── types.ts                # Backend TypeScript types
├── scripts/
│   └── backfill-exercises.ts   # Exercise seeding script
└── package.json
```

## API Endpoints

### Exercises

- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create a new exercise

### Workouts

- `GET /api/workouts?userId=...&date=...` - Get workouts (filtered by userId and/or date)
- `POST /api/workouts` - Create a new workout
- `PUT /api/workouts/:id` - Update an existing workout

## Authentication

The app uses simple password-based authentication:

- **First Launch**: User is prompted to enter password
- **Session Duration**: 24 hours (stored in localStorage)
- **Password Source**: Set via `VITE_APP_PASSWORD` environment variable
- **Default Password**: `minmax2024` (if env var not set)

After 24 hours, users must re-authenticate.

## Default Exercise Setup

When adding a new exercise to a workout:

- **Default Sets**: 2 sets (instead of 3)
- **First Set**: Marked as warmup (`isWarmup: true`)
- **Second Set**: Main work set

## Deployment

### Backend (Vercel Serverless)

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Deploy Backend**:

   ```bash
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:

   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: `production`

4. **Update Frontend API Base**:
   Set `VITE_API_BASE` in your frontend `.env.local` to your Vercel deployment URL:
   ```
   VITE_API_BASE=https://your-app.vercel.app/api
   ```

### Frontend (Vercel)

1. **Connect Repository** to Vercel
2. **Set Environment Variables**:
   - `VITE_APP_PASSWORD`: Your app password
   - `VITE_API_BASE`: Your backend API URL
3. **Deploy**: Vercel will auto-deploy on push to main branch

### Alternative: Deploy Both Together

You can deploy both frontend and backend from the same Vercel project:

1. Create `vercel.json`:

   ```json
   {
     "builds": [
       { "src": "server/index.ts", "use": "@vercel/node" },
       { "src": "package.json", "use": "@vercel/static-build" }
     ],
     "routes": [
       { "src": "/api/(.*)", "dest": "server/index.ts" },
       { "src": "/(.*)", "dest": "$1" }
     ]
   }
   ```

2. Set build command in Vercel:
   - Build Command: `npm run build`
   - Output Directory: `dist`

## Recent Changes

### Authentication System

- Added password-based authentication with 24-hour session expiry
- Auth state stored in localStorage with expiration timestamp
- Clean password input screen matching app design

### Default Exercise Setup

- Changed default sets from 3 to 2
- First set automatically marked as warmup
- Second set is main work set

### Workout Editing

- Click any workout card to edit
- Full workout editing support (exercises, sets, weights, reps, date)
- Backend PUT endpoint for workout updates

### UI Improvements

- Per-exercise progress comparisons (volume and reps changes)
- Improved growth indicator alignment and styling
- Better visual hierarchy for exercise stats

## Development Scripts

```bash
# Frontend development
npm run dev

# Backend development (with watch)
npm run dev:server

# Backend production
npm run server

# Build frontend
npm run build

# Preview production build
npm run preview

# Seed exercises
npx tsx scripts/backfill-exercises.ts
```

## Notes

- The app uses a single user model (`userId: "single"`) - no multi-user support yet
- All dates are handled in local timezone (YYYY-MM-DD format) to avoid timezone issues
- Scrollbars are hidden globally while maintaining scroll functionality
- Workout metrics (total volume, sets count) are computed automatically on save

## License

Private project - All rights reserved
