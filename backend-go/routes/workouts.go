package routes

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sarthak0714/minmax-backend/db"
	"github.com/sarthak0714/minmax-backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// RegisterWorkoutRoutes registers all workout routes
func RegisterWorkoutRoutes(router *gin.RouterGroup) {
	workouts := router.Group("/workouts")
	{
		workouts.GET("", listWorkouts)
		workouts.POST("", createWorkout)
		workouts.GET("/:id", getWorkout)
		workouts.PUT("/:id", updateWorkout)
		workouts.DELETE("/:id", deleteWorkout)
	}
}

// listWorkouts handles GET /api/workouts
func listWorkouts(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := c.Query("userId")
	date := c.Query("date")

	filter := bson.M{}
	if userID != "" {
		filter["userId"] = userID
	}
	if date != "" {
		// Parse date string (YYYY-MM-DD) and create date range
		parsedDate, err := time.Parse("2006-01-02", date)
		if err == nil {
			startOfDay := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, parsedDate.Location())
			endOfDay := startOfDay.Add(24 * time.Hour).Add(-1 * time.Millisecond)
			filter["date"] = bson.M{"$gte": startOfDay, "$lte": endOfDay}
		}
	}

	collection := db.GetCollection("workouts")
	opts := options.Find().SetSort(bson.D{{Key: "date", Value: -1}}).SetLimit(50)
	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var workouts []models.Workout
	if err := cursor.All(ctx, &workouts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	// Convert to response format
	documents := make([]models.WorkoutResponse, len(workouts))
	for i, w := range workouts {
		documents[i] = w.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{"documents": documents})
}

// createWorkout handles POST /api/workouts
func createWorkout(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input struct {
		UserID    string                  `json:"userId" binding:"required"`
		Date      string                  `json:"date" binding:"required"`
		Title     *string                 `json:"title"`
		Notes     *string                 `json:"notes"`
		Exercises []models.WorkoutExercise `json:"exercises"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "message": err.Error()})
		return
	}

	// Parse date
	workoutDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	now := time.Now()
	metrics := models.ComputeMetrics(input.Exercises)

	workout := models.Workout{
		ID:        primitive.NewObjectID(),
		UserID:    input.UserID,
		Date:      workoutDate,
		Title:     input.Title,
		Notes:     input.Notes,
		Exercises: input.Exercises,
		CreatedAt: now,
		UpdatedAt: now,
		Metrics:   metrics,
	}

	if workout.Exercises == nil {
		workout.Exercises = []models.WorkoutExercise{}
	}

	collection := db.GetCollection("workouts")
	_, err = collection.InsertOne(ctx, workout)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"document": workout.ToResponse()})
}

// getWorkout handles GET /api/workouts/:id
func getWorkout(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workout ID"})
		return
	}

	collection := db.GetCollection("workouts")
	var workout models.Workout
	err = collection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&workout)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workout not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"document": workout.ToResponse()})
}

// updateWorkout handles PUT /api/workouts/:id
func updateWorkout(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workout ID"})
		return
	}

	var input struct {
		Date      *string                  `json:"date"`
		Title     *string                  `json:"title"`
		Notes     *string                  `json:"notes"`
		Exercises *[]models.WorkoutExercise `json:"exercises"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	update := bson.M{"updatedAt": time.Now()}
	
	if input.Date != nil {
		workoutDate, err := time.Parse("2006-01-02", *input.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
		update["date"] = workoutDate
	}
	if input.Title != nil {
		update["title"] = *input.Title
	}
	if input.Notes != nil {
		update["notes"] = *input.Notes
	}
	if input.Exercises != nil {
		update["exercises"] = *input.Exercises
		metrics := models.ComputeMetrics(*input.Exercises)
		update["metrics"] = metrics
	}

	collection := db.GetCollection("workouts")
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var workout models.Workout
	err = collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		opts,
	).Decode(&workout)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Workout not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"document": workout.ToResponse()})
}

// deleteWorkout handles DELETE /api/workouts/:id
func deleteWorkout(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workout ID"})
		return
	}

	collection := db.GetCollection("workouts")
	result, err := collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workout not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Workout deleted successfully"})
}
