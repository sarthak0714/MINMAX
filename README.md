# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## MongoDB Atlas integration (Data API)

This app integrates with MongoDB Atlas via App Services Data API (no custom backend). It supports:

- Seeding `exercises` from `src/items/exersise.json`
- Creating and updating per-user `workouts` with sets/reps/weights

### 1) Atlas setup

1. Create an Atlas cluster and an App Services app
2. Enable Data API
3. Create database `minmax` with collections: `exercises`, `workouts`
4. Auth rules:
   - `exercises`: read for authenticated users; write admin only
   - `workouts`: read/write only where `userId == user.id`
5. Generate:
   - App ID (for client)
   - Data API Key (for local seeding ONLY)

### 2) Environment

Create a `.env.local` with:

```
VITE_MONGO_APP_ID=your-app-id
VITE_MONGO_DATA_SOURCE=Cluster0
VITE_MONGO_BASE_URL=https://data.mongodb-api.com/app

# Seeding only (do NOT commit or ship)
MONGO_DATA_API_KEY=your-data-api-key
MONGO_APP_ID=your-app-id
MONGO_DATA_SOURCE=Cluster0
MONGO_DATABASE=minmax
```

### 3) Seed exercises

The seed script performs safe upserts on `slug` and creates indexes.

```
npx ts-node scripts/seed-exercises.ts
```

### 4) Client usage

Use App Services auth to obtain an access token, then `src/lib/workouts.ts` exposes helpers:

- `listExercises(token)`
- `createWorkout(token, workout)`
- `getWorkoutsByDate(token, userId, dateIso)`
- `updateWorkout(token, id, update)`

Security note: never include the Data API Key in client code. It is only used locally for seeding.

## Vercel serverless backend (Mongoose)

This repo includes Vercel Serverless Functions under `api/` that provide:

- `GET /api/exercises` — list seeded exercises
- `POST /api/workouts` — create a workout
- `PATCH /api/workouts/[id]` — update a workout

Models and connection:

- `api/_db.ts` — cached Mongoose connection using `MONGODB_URI`
- `api/models/Exercise.ts`, `api/models/Workout.ts` — schemas

### Deploy to Vercel

1. Set env vars in Vercel Project Settings → Environment Variables:
   - `MONGODB_URI` — your Atlas connection string
   - optional: `MONGODB_DB` (defaults to `minmax`)
2. Deploy (via Vercel Git integration or `vercel --prod`).
3. Test endpoints:
   - `GET https://<your-app>/api/exercises`
   - `POST https://<your-app>/api/workouts` with JSON body
   - `PATCH https://<your-app>/api/workouts/<id>`

Notes:
- Use a single global MongoClient (handled in `api/_db.ts`).
- Add authentication/authorization before production use.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
