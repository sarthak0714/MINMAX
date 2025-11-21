# MINMAX Deployment Guide

Complete guide for deploying the MINMAX backend and mobile app to production.

## Table of Contents

- [Backend Deployment](#backend-deployment)
  - [MongoDB Setup](#mongodb-setup)
  - [Railway Deployment](#railway-deployment)
  - [Render Deployment](#render-deployment)
  - [Fly.io Deployment](#flyio-deployment)
  - [Docker Deployment](#docker-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
  - [iOS Deployment](#ios-deployment)
  - [Android Deployment](#android-deployment)
  - [EAS Build Setup](#eas-build-setup)
- [Configuration](#configuration)
- [Post-Deployment](#post-deployment)

---

## Backend Deployment

### MongoDB Setup

Before deploying the backend, you need a MongoDB instance.

#### Option 1: MongoDB Atlas (Recommended)

1. **Create an account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a new cluster:**
   - Choose free tier (M0)
   - Select a region close to your backend deployment
   - Click "Create Cluster"

3. **Configure database access:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username and password
   - Set permissions to "Read and write to any database"

4. **Configure network access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs for better security

5. **Get connection string:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/`

#### Option 2: Self-Hosted MongoDB

```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod --dbpath /path/to/data --port 27017
```

Connection string: `mongodb://localhost:27017`

---

### Railway Deployment

Railway offers the easiest deployment with automatic builds.

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Create new project:**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your MINMAX repository
   - Choose `backend-go` as the root directory

3. **Configure build settings:**
   - Build Command: `go build -o minmax-server main.go`
   - Start Command: `./minmax-server`

4. **Add environment variables:**
   - Go to "Variables" tab
   - Add:
     ```
     MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
     DB_NAME=minmax
     PORT=8080
     ```

5. **Deploy:**
   - Railway will automatically build and deploy
   - Get your deployment URL from the "Settings" tab
   - Example: `https://minmax-backend-production.up.railway.app`

6. **Test deployment:**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```

---

### Render Deployment

1. **Create Render account** at [render.com](https://render.com)

2. **Create new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `backend-go` directory

3. **Configure service:**
   - Name: `minmax-backend`
   - Environment: `Go`
   - Build Command: `go build -o minmax-server main.go`
   - Start Command: `./minmax-server`
   - Instance Type: Free (or paid for better performance)

4. **Add environment variables:**
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
   DB_NAME=minmax
   PORT=8080
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for build to complete
   - Get URL: `https://minmax-backend.onrender.com`

6. **Note:** Free tier sleeps after 15 minutes of inactivity

---

### Fly.io Deployment

1. **Install Fly CLI:**
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login to Fly:**
   ```bash
   fly auth login
   ```

3. **Navigate to backend:**
   ```bash
   cd backend-go
   ```

4. **Launch app:**
   ```bash
   fly launch
   ```
   - Choose app name
   - Select region
   - Don't deploy yet

5. **Set secrets:**
   ```bash
   fly secrets set MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/"
   fly secrets set DB_NAME="minmax"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

7. **Get URL:**
   ```bash
   fly status
   # URL: https://your-app.fly.dev
   ```

---

### Docker Deployment

For any platform supporting Docker.

1. **Create Dockerfile** in `backend-go/`:
   ```dockerfile
   FROM golang:1.21-alpine AS builder
   WORKDIR /app
   COPY go.mod go.sum ./
   RUN go mod download
   COPY . .
   RUN go build -o minmax-server main.go

   FROM alpine:latest
   RUN apk --no-cache add ca-certificates
   WORKDIR /root/
   COPY --from=builder /app/minmax-server .
   EXPOSE 8080
   CMD ["./minmax-server"]
   ```

2. **Build image:**
   ```bash
   docker build -t minmax-backend .
   ```

3. **Run container:**
   ```bash
   docker run -d \
     -p 8080:8080 \
     -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/" \
     -e DB_NAME="minmax" \
     -e PORT="8080" \
     --name minmax-backend \
     minmax-backend
   ```

4. **Deploy to cloud:**
   - Push to Docker Hub
   - Deploy to AWS ECS, Google Cloud Run, Azure Container Instances, etc.

---

## Mobile App Deployment

### Prerequisites

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure project:**
   ```bash
   cd mobile-app
   eas build:configure
   ```

---

### iOS Deployment

#### Requirements
- macOS computer
- Apple Developer Account ($99/year)
- Xcode installed

#### Steps

1. **Enroll in Apple Developer Program:**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Enroll and pay $99/year fee

2. **Update app.json:**
   ```json
   {
     "expo": {
       "name": "MINMAX",
       "slug": "minmax",
       "ios": {
         "bundleIdentifier": "com.yourcompany.minmax",
         "buildNumber": "1"
       }
     }
   }
   ```

3. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

4. **Download and test:**
   - Download IPA from EAS dashboard
   - Install on test device via TestFlight

5. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

6. **Complete App Store Connect:**
   - Add screenshots
   - Write description
   - Set pricing
   - Submit for review

---

### Android Deployment

#### Requirements
- Google Play Developer Account ($25 one-time fee)

#### Steps

1. **Create Google Play account:**
   - Go to [play.google.com/console](https://play.google.com/console)
   - Pay $25 registration fee

2. **Update app.json:**
   ```json
   {
     "expo": {
       "name": "MINMAX",
       "slug": "minmax",
       "android": {
         "package": "com.yourcompany.minmax",
         "versionCode": 1
       }
     }
   }
   ```

3. **Build APK for testing:**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Build AAB for production:**
   ```bash
   eas build --platform android --profile production
   ```

5. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

6. **Complete Play Console:**
   - Upload screenshots
   - Write description
   - Set content rating
   - Submit for review

---

### EAS Build Setup

Create `eas.json` in `mobile-app/`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Configuration

### Backend URL in Mobile App

After deploying the backend, users configure it in the app:

1. Open the mobile app
2. Tap "Today" 5 times in the Workouts screen
3. Enter backend URL (e.g., `https://minmax-backend.up.railway.app`)
4. Test connection
5. Save

### Environment Variables Summary

**Backend:**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=minmax
PORT=8080
```

**Mobile App:**
- No build-time environment variables needed
- Backend URL configured at runtime in-app

---

## Post-Deployment

### Testing Checklist

**Backend:**
- [ ] Health check endpoint responds
- [ ] Can create exercises
- [ ] Can create workouts
- [ ] Progress endpoints return data
- [ ] CORS is properly configured

**Mobile App:**
- [ ] App installs successfully
- [ ] Can connect to backend
- [ ] Mock mode works as fallback
- [ ] All screens load correctly
- [ ] Can create and edit workouts
- [ ] Charts and analytics display

### Monitoring

**Backend:**
```bash
# Check logs
# Railway: View in dashboard
# Render: View in dashboard
# Fly.io: fly logs

# Monitor health
curl https://your-backend.com/api/health
```

**Mobile App:**
- Use Expo Analytics
- Monitor crash reports
- Check app store reviews

### Updating

**Backend:**
```bash
# Push to GitHub
git push origin main

# Auto-deploys on Railway/Render
# Or manually deploy:
fly deploy  # Fly.io
```

**Mobile App:**
```bash
# Increment version in app.json
# Build new version
eas build --platform all

# Submit update
eas submit --platform all
```

---

## Troubleshooting

### Backend Issues

**Can't connect to MongoDB:**
- Verify connection string
- Check network access settings in Atlas
- Ensure IP whitelist includes deployment server

**Build fails:**
- Check Go version (1.21+)
- Run `go mod tidy`
- Verify all dependencies

**CORS errors:**
- Check CORS configuration in `main.go`
- Ensure frontend URL is allowed

### Mobile App Issues

**Build fails:**
- Check `app.json` configuration
- Verify bundle identifiers are unique
- Ensure all dependencies are installed

**Can't connect to backend:**
- Verify backend URL is correct
- Check backend is deployed and running
- Test with mock mode first

**App rejected:**
- Review app store guidelines
- Add required privacy policy
- Include proper screenshots and description

---

## Security Best Practices

1. **Never commit secrets:**
   - Use `.env` files (add to `.gitignore`)
   - Use platform secret management

2. **Use HTTPS:**
   - All production backends should use HTTPS
   - Most platforms provide this automatically

3. **Secure MongoDB:**
   - Use strong passwords
   - Limit IP access
   - Enable authentication

4. **Regular updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Update Go and Node.js versions


---

**Note: This was fully vibe coded, inital implementation was expected to be a PWA, but the AI code editor enchancements make me make a RN app instead xP**
