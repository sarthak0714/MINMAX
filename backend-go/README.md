# Backend Go API

Go backend for MINMAX workout tracking application.

## Prerequisites

- Go 1.21 or higher
- MongoDB instance
- AWS account (for deployment)

## Local Development

1. Install dependencies:

```bash
go mod download
```

2. Create `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=minmax
PORT=3001
```

3. Run the server:

```bash
go run main.go
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check

- `GET /health` - Server health check

### Exercises

- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create new exercise
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Workouts

- `GET /api/workouts` - List workouts (query: userId, date)
- `POST /api/workouts` - Create workout
- `GET /api/workouts/:id` - Get specific workout
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Progress & Analytics

- `GET /api/progress/volume` - Volume progression data
- `GET /api/progress/stats` - Quick stats with comparisons
- `GET /api/progress/strength-trends` - Per-exercise strength trends
- `GET /api/progress/prs` - Personal records
- `GET /api/progress/heatmap` - Workout frequency heatmap
- `GET /api/progress/insights` - AI-generated insights

## Building for Production

```bash
# Build binary
go build -o minmax-api main.go

# Run binary
./minmax-api
```

## AWS Deployment

### Option 1: EC2

1. Build for Linux:

```bash
GOOS=linux GOARCH=amd64 go build -o minmax-api main.go
```

2. Upload to EC2 instance
3. Run with systemd service

### Option 2: ECS (Docker)

1. Build Docker image:

```bash
docker build -t minmax-api .
```

2. Push to ECR
3. Deploy to ECS

### Option 3: Lambda (with API Gateway)

Use AWS Lambda Go runtime with API Gateway for serverless deployment.

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `MONGODB_DB` - Database name (default: "minmax")
- `PORT` - Server port (default: "3001")

## Project Structure

```
backend-go/
├── main.go           # Entry point
├── db/              # Database connection
│   └── db.go
├── models/          # Data models
│   ├── exercise.go
│   └── workout.go
├── routes/          # API routes
│   ├── exercises.go
│   ├── workouts.go
│   └── progress.go
└── jobs/            # Background jobs
    └── analytics.go
```
