# MINMAX - Workout Tracking App

- Motivation: I just hated UI of the other FOSS apps & the data storage paywall for the ones with good UI, so I made smth which is better.
- it is a comprehensive workout tracking system with a mobile-first approach, featuring a React Native mobile app and a Go-based backend API (I've tried it on android).

## 🏗️ Project Structure

```
MINMAX/
├── mobile-app/          # React Native mobile application (PRIMARY)
├── backend-go/          # Go + Gin + MongoDB REST API
└── web-app/            # Web interface (DEPRECATED)
```

## 📱 Mobile App (Primary Platform)

The mobile app is the main user interface for MINMAX, built with React Native and Expo. Note you need to npm i with legacy peer deps. 

**Key Features:**
- Workout logging with detailed set tracking
- Progress analytics and visualizations
- Interactive body muscle highlighter
- Calendar-based workout history
- Personal record tracking
- Configurable backend URL
- Offline mock mode

**Quick Start:**
```bash
cd mobile-app
npm install --legacy-peer-deps #this is needed since packages in RN suck.
npm start
```

See [mobile-app/README.md](./mobile-app/README.md) for detailed setup and deployment instructions.

## 🚀 Backend API

High-performance REST API built with Go, Gin, and MongoDB.

**Key Features:**
- Exercise and workout management
- Progress analytics and insights
- Muscle split analysis
- RESTful API design
- MongoDB integration

**Quick Start:**
```bash
cd backend-go
go mod download
# Create .env file with MONGODB_URI
go run main.go
```

See [backend-go/README.md](./backend-go/README.md) for detailed setup and deployment instructions.

## 🌐 Web App (Deprecated)

> ⚠️ The web app is deprecated and will be discontinued. Please use the mobile app.

See [web-app/README.md](./web-app/README.md) for migration information.

## 🛠️ Complete Setup Guide

### Prerequisites

- **For Mobile App:**
  - Node.js 18+
  - Expo CLI
  - iOS Simulator (macOS) or Android Emulator

- **For Backend:**
  - Go 1.21+
  - MongoDB 4.4+ (local or cloud)

### Step 1: Set Up Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend-go
   ```

2. **Install dependencies:**
   ```bash
   go mod download
   ```

3. **Configure environment:**
   Create `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
   DB_NAME=minmax
   PORT=8080
   ```

4. **Run the server:**
   ```bash
   # Development
   go run main.go

   # Production build
   go build -o minmax-server main.go
   ./minmax-server
   ```

5. **Verify it's running:**
   ```bash
   curl http://localhost:8080/api/health
   # Should return: {"status":"ok"}
   ```

### Step 2: Set Up Mobile App

1. **Navigate to mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Or scan QR code with Expo Go app
   ```

### Step 3: Connect Mobile App to Backend

The app works in two modes:

**Option 1: Mock Mode (No Backend Required)**
- App automatically uses mock data
- Perfect for testing and development
- No configuration needed

**Option 2: Backend Mode (Connect to Your Backend)**
1. Open the mobile app
2. Tap "Today" 5 times in the Workouts screen
3. Enter your backend URL (e.g., `http://192.168.1.100:8080` or `https://your-backend.com`)
4. Tap "Test Connection"
5. Save

[Backend URL setup](https://github.com/user-attachments/assets/077b1ee5-33de-4fad-8946-36ea40d58c69)


The app will automatically fall back to mock mode if the backend is unreachable.

## 📦 Building for Production

### Backend Deployment

**Option 1: Docker**
```bash
cd backend-go
docker build -t minmax-backend .
docker run -p 8080:8080 --env-file .env minmax-backend
```

**Option 2: Cloud Platforms**

Railway:
```bash
# Push to GitHub, connect in Railway dashboard
# Add environment variables
# Auto-deploys on push
```

Render:
```bash
# Connect GitHub repo
# Build: go build -o minmax-server main.go
# Start: ./minmax-server
```

Fly.io:
```bash
fly launch
fly secrets set MONGODB_URI=<your-uri>
fly deploy
```

### Mobile App Deployment

**iOS (requires macOS + Apple Developer Account)**
```bash
cd mobile-app
eas build --platform ios
eas submit --platform ios
```

**Android**
```bash
cd mobile-app
# APK for testing
eas build --platform android --profile preview

# AAB for Play Store
eas build --platform android --profile production
eas submit --platform android
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `minmax` |
| `PORT` | Server port | `8080` |

### Mobile App Configuration

- **Backend URL**: Configured in-app via secret gesture (tap "Today" 5x)
- **Storage**: Uses AsyncStorage for persistence
- **No build-time env vars required**

## 🏃 Development Workflow

### Local Development Setup

1. **Start MongoDB** (if running locally):
   ```bash
   mongod --dbpath /path/to/data
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   cd backend-go
   go run main.go
   ```

3. **Start Mobile App** (Terminal 2):
   ```bash
   cd mobile-app
   npm start
   ```

4. **Configure Mobile App**:
   - Use `http://localhost:8080` (iOS Simulator)
   - Use `http://10.0.2.2:8080` (Android Emulator)
   - Use `http://YOUR_IP:8080` (Physical Device)

### Testing Backend API

```bash
# Health check
curl http://localhost:8080/api/health

# Get exercises
curl http://localhost:8080/api/exercises

# Create workout
curl -X POST http://localhost:8080/api/workouts \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","date":"2025-11-22T00:00:00Z","title":"Test Workout"}'
```

## 📚 API Documentation

See [backend-go/README.md](./backend-go/README.md) for complete API endpoint documentation.

**Base URL**: `http://your-backend:8080/api`

**Key Endpoints:**
- `GET /health` - Health check
- `GET /exercises` - List exercises
- `GET /workouts` - List workouts
- `POST /workouts` - Create workout
- `GET /progress/volume` - Volume trends
- `GET /progress/stats` - Statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `.env` file exists and is configured correctly
- Check port 8080 is not in use

### Mobile app can't connect to backend
- Verify backend is running (`curl http://localhost:8080/api/health`)
- Use correct IP address for physical devices
- Check firewall settings
- Try mock mode to verify app functionality

### Build errors
```bash
# Backend
cd backend-go
go mod tidy
go clean -cache

# Mobile
cd mobile-app
rm -rf node_modules
npm install
npm start -- --clear
```
