package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// WorkoutSet represents a single set in a workout
type WorkoutSet struct {
	SetNumber int     `bson:"setNumber" json:"setNumber"`
	Reps      int     `bson:"reps" json:"reps"`
	Weight    *float64 `bson:"weight" json:"weight"`
	RIR       *int    `bson:"rir" json:"rir"`
	Tempo     *string `bson:"tempo" json:"tempo"`
	Notes     *string `bson:"notes" json:"notes"`
	IsWarmup  bool    `bson:"isWarmup" json:"isWarmup"`
}

// WorkoutExercise represents an exercise in a workout
type WorkoutExercise struct {
	ExerciseID primitive.ObjectID `bson:"exerciseId" json:"exerciseId"`
	Name       string             `bson:"name" json:"name"`
	Slug       string             `bson:"slug" json:"slug"`
	Sets       []WorkoutSet       `bson:"sets" json:"sets"`
}

// WorkoutMetrics represents workout metrics
type WorkoutMetrics struct {
	TotalVolume *float64 `bson:"totalVolume" json:"totalVolume"`
	NumSets     int      `bson:"numSets" json:"numSets"`
	DurationMin *int     `bson:"durationMin" json:"durationMin"`
}

// Workout represents a workout document
type Workout struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	UserID    string             `bson:"userId" json:"userId" binding:"required"`
	Date      time.Time          `bson:"date" json:"date" binding:"required"`
	Title     *string            `bson:"title" json:"title"`
	Notes     *string            `bson:"notes" json:"notes"`
	Exercises []WorkoutExercise  `bson:"exercises" json:"exercises"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
	Metrics   WorkoutMetrics     `bson:"metrics" json:"metrics"`
}

// WorkoutResponse is the JSON response structure
type WorkoutResponse struct {
	ID        string                    `json:"_id"`
	UserID    string                    `json:"userId"`
	Date      string                    `json:"date"`
	Title     *string                   `json:"title"`
	Notes     *string                   `json:"notes"`
	Exercises []WorkoutExerciseResponse `json:"exercises"`
	CreatedAt string                    `json:"createdAt"`
	UpdatedAt string                    `json:"updatedAt"`
	Metrics   WorkoutMetrics            `json:"metrics"`
}

// WorkoutExerciseResponse is the JSON response for exercises
type WorkoutExerciseResponse struct {
	ExerciseID string       `json:"exerciseId"`
	Name       string       `json:"name"`
	Slug       string       `json:"slug"`
	Sets       []WorkoutSet `json:"sets"`
}

// ToResponse converts Workout to WorkoutResponse
func (w *Workout) ToResponse() WorkoutResponse {
	exercises := make([]WorkoutExerciseResponse, len(w.Exercises))
	for i, ex := range w.Exercises {
		exercises[i] = WorkoutExerciseResponse{
			ExerciseID: ex.ExerciseID.Hex(),
			Name:       ex.Name,
			Slug:       ex.Slug,
			Sets:       ex.Sets,
		}
	}

	// Format date as YYYY-MM-DD in local timezone
	dateStr := w.Date.Format("2006-01-02")

	return WorkoutResponse{
		ID:        w.ID.Hex(),
		UserID:    w.UserID,
		Date:      dateStr,
		Title:     w.Title,
		Notes:     w.Notes,
		Exercises: exercises,
		CreatedAt: w.CreatedAt.Format(time.RFC3339),
		UpdatedAt: w.UpdatedAt.Format(time.RFC3339),
		Metrics:   w.Metrics,
	}
}

// ComputeMetrics calculates workout metrics
func ComputeMetrics(exercises []WorkoutExercise) WorkoutMetrics {
	totalVolume := 0.0
	numSets := 0

	for _, ex := range exercises {
		for _, set := range ex.Sets {
			numSets++
			if set.Weight != nil && set.Reps > 0 {
				totalVolume += *set.Weight * float64(set.Reps)
			}
		}
	}

	return WorkoutMetrics{
		TotalVolume: &totalVolume,
		NumSets:     numSets,
		DurationMin: nil,
	}
}
