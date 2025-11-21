# MINMAX Backend (Go)

A high-performance REST API backend for the MINMAX workout tracking application, built with Go, Gin, and MongoDB.

## Features

- **Exercise Management** - Create, read, update, and delete exercises
- **Workout Tracking** - Log workouts with sets, reps, weight, RIR, and notes
- **Progress Analytics** - Track volume trends, strength progression, and PRs
- **Muscle Split Analysis** - Visualize training distribution across muscle groups
- **RESTful API** - Clean, consistent API design
- **MongoDB Integration** - Flexible NoSQL data storage
- **CORS Support** - Cross-origin resource sharing enabled

## Tech Stack

- **Language**: Go 1.21+
- **Framework**: Gin Web Framework
- **Database**: MongoDB
- **Driver**: Official MongoDB Go Driver

## Prerequisites

- Go 1.21 or higher
- MongoDB 4.4 or higher (local or cloud instance)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MINMAX/backend-go
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `backend-go` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=minmax
   PORT=8080
   ```

   Or use MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   DB_NAME=minmax
   PORT=8080
   ```

## Running the Server

### Development Mode

```bash
go run main.go
```

The server will start on `http://localhost:8080`

### Production Build

```bash
# Build the binary
go build -o minmax-server main.go

# Run the binary
./minmax-server
```

### Using Air (Hot Reload)

For development with hot reload:

```bash
# Install Air
go install github.com/cosmtrek/air@latest

# Run with Air
air
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Exercises
- `GET /api/exercises` - List all exercises
- `POST /api/exercises` - Create new exercise
- `GET /api/exercises/:id` - Get exercise by ID
- `PUT /api/exercises/:id` - Update exercise
- `DELETE /api/exercises/:id` - Delete exercise

### Workouts
- `GET /api/workouts` - List all workouts (supports `?userId=` and `?date=` filters)
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/:id` - Get workout by ID
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Progress
- `GET /api/progress/volume?range=7d` - Volume data over time
- `GET /api/progress/stats?range=7d` - Aggregate statistics
- `GET /api/progress/strength-trends?range=30d` - Exercise strength progression
- `GET /api/progress/prs` - Personal records
- `GET /api/progress/heatmap` - Workout frequency heatmap
- `GET /api/progress/insights` - AI-generated insights

## Project Structure

```
backend-go/
├── main.go              # Application entry point
├── db/
│   └── mongo.go        # MongoDB connection setup
├── models/
│   ├── exercise.go     # Exercise data model
│   └── workout.go      # Workout data model
├── routes/
│   ├── exercise.go     # Exercise route handlers
│   ├── workout.go      # Workout route handlers
│   └── progress.go     # Progress analytics handlers
├── go.mod              # Go module dependencies
└── .env                # Environment configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `minmax` |
| `PORT` | Server port | `8080` |

## Database Schema

### Exercises Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "targetMuscle": ["string"],
  "meta": ["string"],
  "slug": "string",
  "createdAt": "ISODate"
}
```

### Workouts Collection
```json
{
  "_id": "ObjectId",
  "userId": "string",
  "date": "ISODate",
  "title": "string",
  "notes": "string",
  "exercises": [
    {
      "exerciseId": "string",
      "name": "string",
      "slug": "string",
      "sets": [
        {
          "setNumber": "number",
          "reps": "number",
          "weight": "number",
          "rir": "number",
          "tempo": "string",
          "notes": "string",
          "isWarmup": "boolean"
        }
      ]
    }
  ],
  "metrics": {
    "totalVolume": "number",
    "numSets": "number",
    "durationMin": "number"
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## Deployment

### Docker Deployment

Create a `Dockerfile`:
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

Build and run:
```bash
docker build -t minmax-backend .
docker run -p 8080:8080 --env-file .env minmax-backend
```

### Cloud Deployment

#### Railway
1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

#### Render
1. Create new Web Service
2. Connect repository
3. Set build command: `go build -o minmax-server main.go`
4. Set start command: `./minmax-server`
5. Add environment variables

#### Fly.io
```bash
fly launch
fly secrets set MONGODB_URI=<your-uri>
fly deploy
```

## Development

### Adding New Routes

1. Create handler in `routes/` directory
2. Define route in handler file
3. Register route group in `main.go`

### Adding New Models

1. Create model struct in `models/` directory
2. Add BSON tags for MongoDB
3. Implement validation if needed

## Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
