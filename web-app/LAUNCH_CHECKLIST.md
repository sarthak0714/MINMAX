# 🚀 MINMAX Launch Checklist

## Pre-Launch Setup

### ☐ 1. Install Prerequisites

- [ ] **Go 1.21+** installed

  ```bash
  # Download from https://go.dev/dl/
  # Verify: go version
  ```

- [ ] **Node.js 18+** installed

  ```bash
  # Verify: node --version
  # Should show v18.x or higher
  ```

- [ ] **MongoDB** setup

  - [ ] Option A: MongoDB Atlas account created (Free M0)
  - [ ] Option B: Local MongoDB installed

- [ ] **AWS Account** (for deployment)
  - [ ] Account created
  - [ ] AWS CLI installed and configured

---

## Backend Setup

### ☐ 2. Configure Go Backend

- [ ] Navigate to backend directory

  ```bash
  cd backend-go
  ```

- [ ] Download dependencies

  ```bash
  go mod download
  ```

- [ ] Create `.env` file

  ```bash
  # Create .env with:
  MONGODB_URI=your_mongodb_connection_string
  MONGODB_DB=minmax
  PORT=3001
  ```

- [ ] Test connection

  ```bash
  go run main.go
  # Should see: "Server starting on port 3001"
  ```

- [ ] Verify API health

  ```bash
  curl http://localhost:3001/health
  # Should return: {"status":"ok"}
  ```

- [ ] Test API endpoints

  ```bash
  # Get exercises
  curl http://localhost:3001/api/exercises

  # Should return: {"documents":[]}
  ```

---

## Mobile App Setup

### ☐ 3. Configure React Native App

- [ ] Navigate to mobile directory

  ```bash
  cd mobile-app
  ```

- [ ] Install dependencies

  ```bash
  npm install
  ```

- [ ] Create `.env` file

  ```bash
  # For Android emulator:
  EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
  EXPO_PUBLIC_AUTH_PASSWORD=yourpassword

  # For physical device (use your computer's IP):
  # EXPO_PUBLIC_API_URL=http://192.168.1.X:3001
  ```

- [ ] Start Expo dev server

  ```bash
  npm start
  ```

- [ ] Test on Android

  ```bash
  npm run android
  # Or press 'a' in Expo terminal
  ```

- [ ] Test on Web

  ```bash
  npm run web
  # Or press 'w' in Expo terminal
  ```

- [ ] Verify app loads
  - [ ] Login screen appears
  - [ ] Can enter password
  - [ ] Can login successfully
  - [ ] Bottom tabs visible

---

## Functional Testing

### ☐ 4. Test Core Features

**Authentication:**

- [ ] Login with password works
- [ ] Auth state persists on app reload
- [ ] Logout works (add logout button if needed)

**Exercises:**

- [ ] Can view exercise list
- [ ] Search exercises works
- [ ] Exercises load from API

**Workouts:**

- [ ] Today screen loads
- [ ] Shows placeholder content

**Progress:**

- [ ] Progress screen loads
- [ ] Shows placeholder stats

**API Integration:**

- [ ] Backend responds to requests
- [ ] No CORS errors in console
- [ ] Data loads without errors

---

## Build & Deploy

### ☐ 5. Backend Deployment (AWS EC2)

- [ ] Launch EC2 instance

  - [ ] Instance type: t3.small
  - [ ] OS: Ubuntu 22.04 LTS
  - [ ] Security group: Ports 22, 80, 443, 3001

- [ ] Build for Linux

  ```bash
  cd backend-go
  GOOS=linux GOARCH=amd64 go build -o minmax-api main.go
  ```

- [ ] Upload to EC2

  ```bash
  scp minmax-api ubuntu@YOUR_IP:/home/ubuntu/
  scp .env ubuntu@YOUR_IP:/home/ubuntu/
  ```

- [ ] Setup systemd service

  - [ ] Create service file: `/etc/systemd/system/minmax-api.service`
  - [ ] Enable service: `sudo systemctl enable minmax-api`
  - [ ] Start service: `sudo systemctl start minmax-api`
  - [ ] Verify: `sudo systemctl status minmax-api`

- [ ] Setup Nginx (optional)

  - [ ] Install Nginx
  - [ ] Configure reverse proxy
  - [ ] Setup SSL with Let's Encrypt

- [ ] Test deployed API
  ```bash
  curl http://YOUR_IP:3001/health
  # Or: curl https://yourdomain.com/health
  ```

### ☐ 6. Mobile App Build

**Android APK:**

- [ ] Install EAS CLI

  ```bash
  npm install -g eas-cli
  ```

- [ ] Login to Expo

  ```bash
  eas login
  ```

- [ ] Configure build

  ```bash
  eas build:configure
  ```

- [ ] Update production API URL in `.env`

  ```bash
  EXPO_PUBLIC_API_URL=https://yourdomain.com
  ```

- [ ] Build APK

  ```bash
  eas build --platform android --profile preview
  ```

- [ ] Download and test APK
  - [ ] Install on Android device
  - [ ] Test all features
  - [ ] Verify API connection

**Web Deployment:**

- [ ] Export for web

  ```bash
  npx expo export --platform web
  ```

- [ ] Deploy to Vercel/Netlify
  - [ ] Create new project
  - [ ] Deploy `dist/` folder
  - [ ] Set environment variables
  - [ ] Test deployed web app

---

## Production Readiness

### ☐ 7. Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] MongoDB authentication enabled
- [ ] Strong passwords used
- [ ] API rate limiting considered
- [ ] CORS restricted to specific origins
- [ ] Security group rules minimal
- [ ] Secrets stored in AWS Secrets Manager (for ECS)
- [ ] Regular backups configured

### ☐ 8. Monitoring Setup

- [ ] CloudWatch logs enabled (AWS)
- [ ] Error tracking setup (optional: Sentry)
- [ ] API health monitoring
- [ ] Database backup strategy
- [ ] Alert notifications configured

### ☐ 9. Documentation

- [ ] API documentation reviewed
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available
- [ ] Team members trained

---

## Post-Launch

### ☐ 10. Verify Production

- [ ] Backend health check passes
- [ ] Mobile app connects to production API
- [ ] Can create exercises
- [ ] Can log workouts
- [ ] Progress data displays
- [ ] No console errors
- [ ] Performance acceptable

### ☐ 11. User Acceptance

- [ ] Test with real users
- [ ] Collect feedback
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Address critical issues

---

## Future Enhancements

### ☐ Short-term (Next Sprint)

- [ ] Implement Victory Native charts
- [ ] Add workout creation UI
- [ ] Calendar heatmap visualization
- [ ] Pull-to-refresh on lists
- [ ] Loading states and skeletons
- [ ] Error handling improvements

### ☐ Medium-term

- [ ] Offline-first architecture
- [ ] Proper JWT authentication
- [ ] User registration/profiles
- [ ] Social features (share workouts)
- [ ] Exercise video demos
- [ ] Advanced analytics

### ☐ Long-term

- [ ] iOS app (Apple App Store)
- [ ] Apple Watch integration
- [ ] Wear OS support
- [ ] AI workout recommendations
- [ ] Integration with fitness APIs
- [ ] Workout templates library

---

## Troubleshooting Guide

### Backend Issues

**Problem: Can't connect to MongoDB**

```bash
# Solution: Check connection string
mongosh "YOUR_MONGODB_URI"

# Verify IP whitelist in Atlas
# Add 0.0.0.0/0 for testing (not production!)
```

**Problem: Port 3001 already in use**

```bash
# Solution: Kill process or change port
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux:
lsof -ti:3001 | xargs kill
```

**Problem: Go build fails**

```bash
# Solution: Update dependencies
go mod tidy
go mod download
```

### Mobile App Issues

**Problem: Can't connect to API**

```bash
# Solution: Check API URL
# Android emulator: http://10.0.2.2:3001
# Physical device: http://YOUR_LOCAL_IP:3001

# Test backend is running:
curl http://localhost:3001/health
```

**Problem: NativeWind styles not working**

```bash
# Solution: Clear cache and rebuild
npm start -- --clear
npm run android
```

**Problem: Build fails on EAS**

```bash
# Solution: Check eas.json configuration
# Verify all dependencies are installed
# Check Expo SDK compatibility
```

---

## Success Criteria

Your launch is successful when:

- ✅ Backend deployed and accessible
- ✅ Mobile app builds successfully
- ✅ Users can authenticate
- ✅ Users can view exercises
- ✅ API responds quickly (< 500ms)
- ✅ No critical errors in logs
- ✅ Basic features working
- ✅ Documentation complete

---

## Rollback Plan

If critical issues arise:

1. **Backend**: Revert to previous systemd service
2. **Mobile**: Roll back to previous APK version
3. **Database**: Restore from backup
4. **Notify users**: Via app banner or email

---

## Next Review Date

Schedule review for **1 week after launch**:

- [ ] Check error logs
- [ ] Review performance metrics
- [ ] Collect user feedback
- [ ] Plan next iteration

---

## Notes

```
Launch Date: ______________
Launch Time: ______________
Deployed By: ______________

Production URLs:
- API: ______________
- Web: ______________
- APK: ______________

Issues Encountered:
_______________________
_______________________
_______________________

Lessons Learned:
_______________________
_______________________
_______________________
```

---

**Remember**: This is v1.0. Focus on core functionality and stability. Additional features can be added iteratively.

**Good luck with your launch! 🚀**
