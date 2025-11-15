# MINMAX - Complete Migration Guide

## Overview

This project has been migrated from a React web app with dual backends (Node.js Express + Vercel Edge) to:

- **Backend**: Single consolidated Go API (deployable to AWS)
- **Frontend**: React Native with Expo (Android native + Web support)

## Architecture

```
MINMAX/
├── backend-go/          # Go API server
│   ├── main.go
│   ├── db/             # MongoDB connection
│   ├── models/         # Data models
│   ├── routes/         # API endpoints
│   └── jobs/           # Background jobs
│
├── mobile-app/         # React Native app
│   ├── src/
│   │   ├── config/    # Configuration
│   │   ├── lib/       # API client, auth, storage
│   │   └── screens/   # UI screens
│   └── App.tsx
│
└── (old files)        # Original web app files
```

## Quick Start

### 1. Backend Setup (Go)

```bash
cd backend-go

# Install Go dependencies
go mod download

# Create .env file
echo "MONGODB_URI=your_mongodb_uri" > .env
echo "MONGODB_DB=minmax" >> .env
echo "PORT=3001" >> .env

# Run the server
go run main.go
```

Backend will be available at `http://localhost:3001`

### 2. Mobile App Setup (React Native)

```bash
cd mobile-app

# Install dependencies
npm install

# Create .env file
echo "EXPO_PUBLIC_API_URL=http://10.0.2.2:3001" > .env
echo "EXPO_PUBLIC_AUTH_PASSWORD=your_password" >> .env

# Start Expo
npm start

# Press 'a' for Android or 'w' for web
```

## Deployment

### Backend - AWS EC2

1. **Launch EC2 Instance**:

   - Amazon Linux 2023 or Ubuntu 22.04
   - t3.small or larger
   - Open port 3001 (or use nginx on port 80/443)

2. **Build and Deploy**:

```bash
# On local machine
cd backend-go
GOOS=linux GOARCH=amd64 go build -o minmax-api main.go

# Copy to EC2
scp minmax-api ec2-user@your-instance:/home/ec2-user/
scp .env ec2-user@your-instance:/home/ec2-user/

# On EC2
chmod +x minmax-api
./minmax-api
```

3. **Create systemd service** (`/etc/systemd/system/minmax-api.service`):

```ini
[Unit]
Description=MINMAX API Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
ExecStart=/home/ec2-user/minmax-api
Restart=on-failure
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable minmax-api
sudo systemctl start minmax-api
```

### Backend - AWS ECS (Docker)

1. **Build Docker image**:

```bash
cd backend-go
docker build -t minmax-api .
```

2. **Push to ECR**:

```bash
aws ecr create-repository --repository-name minmax-api
docker tag minmax-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/minmax-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/minmax-api:latest
```

3. **Deploy to ECS**: Use AWS Console or Terraform to create ECS service

### Mobile App - Android APK

```bash
cd mobile-app

# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build
eas build --platform android --profile preview
```

### Mobile App - Web Deploy

```bash
cd mobile-app

# Export static files
npx expo export --platform web

# Deploy dist/ to Vercel, Netlify, or any static host
```

## API Endpoints

All endpoints are prefixed with `/api`

### Exercises

- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create exercise
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Workouts

- `GET /api/workouts?userId=X&date=YYYY-MM-DD` - List workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts/:id` - Get workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Progress

- `GET /api/progress/volume?range=last-30-days`
- `GET /api/progress/stats?range=last-7-days`
- `GET /api/progress/strength-trends`
- `GET /api/progress/prs`
- `GET /api/progress/heatmap`
- `GET /api/progress/insights`

## Environment Variables

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=minmax
PORT=3001
```

### Mobile App (.env)

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com
EXPO_PUBLIC_AUTH_PASSWORD=your_password
```

## Migration Notes

### What Was Migrated

✅ **Backend**:

- All Express routes → Go Gin routes
- Mongoose models → Go structs with MongoDB driver
- Node-cron → robfig/cron
- CORS configuration
- MongoDB aggregation pipelines

✅ **Frontend**:

- React components → React Native components
- CSS/TailwindCSS → NativeWind
- localStorage → AsyncStorage
- Fetch API (no changes needed)
- Authentication logic

✅ **Features Preserved**:

- Exercise management
- Workout tracking
- Progress analytics
- Volume/strength trends
- Personal records
- Insights generation
- Heatmap data

### What Needs Additional Work

⚠️ **Charts**: Currently showing placeholder text. Need to integrate Victory Native:

```tsx
import { VictoryBar, VictoryChart } from "victory-native";
```

⚠️ **Animations**: Basic UI implemented. Add Reanimated animations:

```tsx
import Animated, { FadeIn } from "react-native-reanimated";
```

⚠️ **Advanced UI Components**:

- Add workout drawer (bottom sheet)
- Calendar visualization (bubbles)
- Exercise sets UI with inline editing
- Pull-to-refresh on lists

⚠️ **PDF Export**: Not implemented in mobile app. Consider:

- Use `react-native-print` for native
- Or server-side PDF generation
- Or remove feature for mobile

⚠️ **Offline Support**: AsyncStorage in place, but need to implement:

- Offline queue for API requests
- Sync when back online
- Local cache for exercises/workouts

## Testing

### Backend

```bash
cd backend-go

# Run tests (when added)
go test ./...

# Manual testing
curl http://localhost:3001/health
curl http://localhost:3001/api/exercises
```

### Mobile App

```bash
cd mobile-app

# Run on Android emulator
npm run android

# Run on web
npm run web

# Test API connection
# Make sure backend is running first!
```

## Tech Stack Summary

### Backend

- **Language**: Go 1.21+
- **Web Framework**: Gin
- **Database**: MongoDB (mongo-driver)
- **CORS**: gin-contrib/cors
- **Cron**: robfig/cron
- **Deployment**: AWS EC2/ECS

### Frontend

- **Framework**: React Native 0.81 / Expo 54
- **UI**: NativeWind 4 (TailwindCSS)
- **Navigation**: React Navigation 7
- **State**: React Query
- **Storage**: AsyncStorage
- **Charts**: Victory Native 41
- **Animations**: Reanimated 4 + Moti

## Performance Considerations

### Backend

- Connection pooling: MaxPoolSize=10
- MongoDB indexes on `userId` and `date`
- Aggregation pipelines optimized
- CORS limited to specific origins

### Mobile

- React Query caching (5 min default)
- Lazy loading of screens
- Memoized components
- Optimized list rendering with FlatList

## Security Notes

⚠️ **Current Auth**: Simple password check (not production-ready)

**For Production**:

1. Implement proper JWT authentication
2. Add user registration/login
3. Secure password hashing (bcrypt)
4. HTTPS only
5. Rate limiting
6. Input validation

## Troubleshooting

### Backend won't start

- Check MongoDB URI is correct
- Ensure port 3001 is available
- Verify Go version: `go version`

### Mobile app can't connect to backend

- Use `10.0.2.2:3001` for Android emulator
- Use your machine's IP for physical devices
- Check backend is running: `curl http://localhost:3001/health`

### NativeWind styles not working

- Ensure `babel.config.js` includes `nativewind/babel`
- Clear Metro cache: `npm start -- --clear`
- Rebuild: `npm run android` or `npm run ios`

## Next Steps

1. ✅ Backend consolidated to Go
2. ✅ React Native app initialized
3. ✅ Basic screens created
4. ⏭️ Implement Victory Native charts
5. ⏭️ Add workout creation UI
6. ⏭️ Implement animations
7. ⏭️ Add offline support
8. ⏭️ Deploy to AWS
9. ⏭️ Build Android APK
10. ⏭️ Deploy web version

## Support

For issues or questions:

1. Check the README in `backend-go/` or `mobile-app/`
2. Review API documentation above
3. Check logs: `journalctl -u minmax-api -f` (systemd)
