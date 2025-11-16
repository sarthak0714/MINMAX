package routes

import (
	"context"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sarthak0714/minmax-backend/db"
	"github.com/sarthak0714/minmax-backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// RegisterExerciseRoutes registers all exercise routes
func RegisterExerciseRoutes(router *gin.RouterGroup) {
	exercises := router.Group("/exercises")
	{
		exercises.GET("", listExercises)
		exercises.HEAD("", healthCheck)
		exercises.POST("", createExercise)
		exercises.PUT("/:id", updateExercise)
		exercises.DELETE("/:id", deleteExercise)
	}
}

// healthCheck handles HEAD /api/exercises for health checks
func healthCheck(c *gin.Context) {
	c.Status(http.StatusOK)
}

// listExercises handles GET /api/exercises
func listExercises(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	collection := db.GetCollection("exercises")

	opts := options.Find().SetSort(bson.D{{Key: "name", Value: 1}}).SetLimit(500)
	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var exercises []models.Exercise
	if err := cursor.All(ctx, &exercises); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	// Convert to response format
	documents := make([]models.ExerciseResponse, len(exercises))
	for i, ex := range exercises {
		documents[i] = ex.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{"documents": documents})
}

// createExercise handles POST /api/exercises
func createExercise(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input struct {
		Name         string   `json:"name" binding:"required"`
		TargetMuscle []string `json:"targetMuscle"`
		Meta         []string `json:"meta"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required field: name"})
		return
	}

	// Generate slug from name
	slug := generateSlug(input.Name)

	// Check if exercise with same slug already exists
	collection := db.GetCollection("exercises")
	var existing models.Exercise
	err := collection.FindOne(ctx, bson.M{"slug": slug}).Decode(&existing)
	if err == nil {
		// Exercise exists
		c.JSON(http.StatusConflict, gin.H{
			"error":    "Exercise with this name already exists",
			"document": existing.ToResponse(),
		})
		return
	}

	// Create new exercise
	exercise := models.Exercise{
		ID:           primitive.NewObjectID(),
		Name:         input.Name,
		TargetMuscle: input.TargetMuscle,
		Meta:         input.Meta,
		Slug:         slug,
		CreatedAt:    time.Now(),
	}

	if exercise.TargetMuscle == nil {
		exercise.TargetMuscle = []string{}
	}
	if exercise.Meta == nil {
		exercise.Meta = []string{}
	}

	_, err = collection.InsertOne(ctx, exercise)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			c.JSON(http.StatusConflict, gin.H{"error": "Exercise with this slug already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"document": exercise.ToResponse()})
}

// updateExercise handles PUT /api/exercises/:id
func updateExercise(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exercise ID"})
		return
	}

	var input struct {
		Name         string   `json:"name"`
		TargetMuscle []string `json:"targetMuscle"`
		Meta         []string `json:"meta"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	update := bson.M{}
	if input.Name != "" {
		update["name"] = input.Name
		update["slug"] = generateSlug(input.Name)
	}
	if input.TargetMuscle != nil {
		update["targetMuscle"] = input.TargetMuscle
	}
	if input.Meta != nil {
		update["meta"] = input.Meta
	}

	collection := db.GetCollection("exercises")
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var exercise models.Exercise
	err = collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		opts,
	).Decode(&exercise)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Exercise not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"document": exercise.ToResponse()})
}

// deleteExercise handles DELETE /api/exercises/:id
func deleteExercise(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exercise ID"})
		return
	}

	collection := db.GetCollection("exercises")
	result, err := collection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server Error", "message": err.Error()})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exercise not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exercise deleted successfully"})
}

// generateSlug creates a URL-friendly slug from a name
func generateSlug(name string) string {
	// Convert to lowercase
	slug := strings.ToLower(name)

	// Replace non-alphanumeric characters with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remove leading and trailing hyphens
	slug = strings.Trim(slug, "-")

	return slug
}
