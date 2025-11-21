# MINMAX Mobile App

A modern React Native mobile application for tracking workouts, analyzing progress, and optimizing your training.

## Features

- **📊 Workout Tracking** - Log exercises with sets, reps, weight, RIR, and notes
- **📈 Progress Analytics** - Visualize volume trends, strength progression, and PRs
- **💪 Body Muscle Visualization** - Interactive body highlighter showing muscle activation
- **📅 Calendar View** - Track workout frequency and consistency
- **🎯 Personal Records** - Automatic PR tracking for all exercises
- **🔧 Configurable Backend** - Connect to your own backend or use mock data
- **🌙 Dark Theme** - Beautiful dark UI optimized for gym environments

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Charts**: Victory Native
- **UI Components**: NativeWind (Tailwind CSS)
- **Storage**: AsyncStorage
- **Icons**: FontAwesome5, Ionicons
- **Body Visualization**: react-native-body-highlighter

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for physical device testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MINMAX/mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## Running the App

### Development

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Using Expo Go

1. Install Expo Go on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
2. Run `npm start`
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

## Configuration

### Backend URL Setup

The app supports two modes:

1. **Mock Mode** (Default) - Uses sample data, no backend required
2. **Backend Mode** - Connects to your deployed backend

To configure the backend URL:
1. Tap "Today" 5 times in the Workouts screen
2. Enter your backend URL (e.g., `https://your-backend.com`)
3. Test the connection
4. Save

The configuration is stored locally using AsyncStorage and persists across app restarts.

### Mock Data

When no backend URL is configured or the backend is unreachable, the app automatically falls back to mock mode with:
- 8 sample workouts (today + past 7 days)
- Dynamic dates based on current date
- Realistic exercise data and progression
- Full analytics and visualizations

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── WorkoutsScreen.tsx      # Main workout logging screen
│   │   ├── ProgressScreen.tsx      # Analytics and charts
│   │   └── LoginScreen.tsx         # Authentication (deprecated)
│   ├── lib/
│   │   ├── api.ts                  # API client with mock fallback
│   │   ├── config.ts               # Backend URL configuration
│   │   ├── dynamicMockData.ts      # Mock data generator
│   │   └── mockData.json           # Static exercise data
│   └── components/                 # Reusable UI components
├── App.tsx                         # App entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

## Building for Production

### iOS (requires macOS)

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### EAS Configuration

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure your project:
   ```bash
   eas build:configure
   ```

4. Update `eas.json` with your build profiles

## Environment Variables

The app uses AsyncStorage for runtime configuration. No build-time environment variables are required.

## Screens

### Workouts Screen
- Calendar view (month/week modes)
- Workout list for selected date
- Add/edit/delete workouts
- Exercise selection with muscle targeting
- Set tracking with RIR, tempo, and notes

### Progress Screen
- Volume trends chart
- Strength progression by exercise
- Personal records table
- Muscle split visualization (body highlighter)
- Workout heatmap
- Training insights

## Key Features

### Secret Gesture Configuration
- Tap "Today" 5 times to access backend URL configuration
- Allows users to connect to their own backend instance
- Automatic fallback to mock mode on connection failure

### Mock Mode Indicator
- Orange "🔧 Mock" badge when using mock data
- Visible in the header for transparency

### Dynamic Mock Data
- Generates fresh workout data based on current date
- Includes today + past 7 days
- Realistic progression and variety

## Development

### Adding New Screens

1. Create screen component in `src/screens/`
2. Add to navigation in `App.tsx`
3. Update types if using TypeScript

### Modifying API Client

The API client (`src/lib/api.ts`) automatically handles:
- Backend connectivity
- Mock mode fallback
- Error handling
- Request/response formatting

### Customizing Mock Data

Edit `src/lib/dynamicMockData.ts` to modify:
- Workout templates
- Exercise selection
- Volume and progression data

## Troubleshooting

### App won't start
```bash
# Clear cache and restart
npm start -- --clear
```

### Build errors
```bash
# Clean and reinstall
rm -rf node_modules
npm install
```

### iOS simulator issues
```bash
# Reset simulator
xcrun simctl erase all
```

## Deployment Checklist

- [ ] Update `app.json` with correct app name and bundle identifier
- [ ] Configure `eas.json` for production builds
- [ ] Test on both iOS and Android
- [ ] Verify backend connectivity
- [ ] Test mock mode fallback
- [ ] Update app icons and splash screen
- [ ] Review privacy policy and terms
- [ ] Submit for app store review

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on iOS and Android
5. Submit a pull request

## License

MIT License - see LICENSE file for details
