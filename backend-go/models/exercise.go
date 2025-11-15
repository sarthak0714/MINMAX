package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Exercise represents an exercise document
type Exercise struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
	Name         string             `bson:"name" json:"name" binding:"required"`
	TargetMuscle []string           `bson:"targetMuscle" json:"targetMuscle"`
	Meta         []string           `bson:"meta" json:"meta"`
	Slug         string             `bson:"slug" json:"slug" binding:"required"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
}

// ExerciseResponse is the JSON response structure
type ExerciseResponse struct {
	ID           string    `json:"_id"`
	Name         string    `json:"name"`
	TargetMuscle []string  `json:"targetMuscle"`
	Meta         []string  `json:"meta"`
	Slug         string    `json:"slug"`
	CreatedAt    string    `json:"createdAt"`
}

// ToResponse converts Exercise to ExerciseResponse
func (e *Exercise) ToResponse() ExerciseResponse {
	return ExerciseResponse{
		ID:           e.ID.Hex(),
		Name:         e.Name,
		TargetMuscle: e.TargetMuscle,
		Meta:         e.Meta,
		Slug:         e.Slug,
		CreatedAt:    e.CreatedAt.Format(time.RFC3339),
	}
}
