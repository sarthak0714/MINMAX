# MINMAX Mobile App

React Native mobile app for MINMAX workout tracking.

## Prerequisites

- Node.js 18+
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

## Installation

```bash
cd mobile-app
npm install
```

## Configuration

Create a `.env` file in the `mobile-app` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_AUTH_PASSWORD=your_password_here
```

For Android emulator, use `http://10.0.2.2:3001` instead of `localhost`.

## Running the App

### Development

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### Building for Production

#### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

#### Web Deployment

```bash
# Build for web
npm run build:web

# Output will be in web-build/
# Deploy to any static hosting (Vercel, Netlify, etc.)
```

## Project Structure

```
mobile-app/
├── src/
│   ├── config/
│   │   └── env.ts          # Environment configuration
│   ├── lib/
│   │   ├── api.ts          # API client
│   │   ├── auth.ts         # Authentication
│   │   └── storage.ts      # AsyncStorage wrapper
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── WorkoutsScreen.tsx
│   │   ├── ExercisesScreen.tsx
│   │   └── ProgressScreen.tsx
│   └── components/         # Reusable components
├── App.tsx                 # Main app component
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
└── tailwind.config.js     # Tailwind configuration
```

## Features

- ✅ Authentication with password
- ✅ Exercise library management
- ✅ Workout tracking
- ✅ Progress analytics
- ✅ Dark mode UI
- ✅ Offline support (AsyncStorage)
- ✅ Cross-platform (Android, iOS, Web)

## Tech Stack

- **Framework**: React Native (Expo)
- **UI**: NativeWind (TailwindCSS)
- **Navigation**: React Navigation
- **State Management**: React Query
- **Storage**: AsyncStorage
- **Charts**: Victory Native
- **Animations**: React Native Reanimated + Moti

## API Integration

The app connects to the Go backend API. Ensure the backend is running before using the app.

Default API endpoint: `http://localhost:3001`

## Troubleshooting

### Metro bundler issues

```bash
npm start -- --clear
```

### Android connection issues

Make sure your backend is accessible from the emulator:

- Use `http://10.0.2.2:3001` for Android emulator
- Use your computer's IP address for physical devices

### iOS build issues

```bash
cd ios
pod install
cd ..
```

## License

MIT
