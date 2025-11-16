package routes

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sarthak0714/minmax-backend/db"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// RegisterProgressRoutes registers all progress routes
func RegisterProgressRoutes(router *gin.RouterGroup) {
	progress := router.Group("/progress")
	{
		progress.GET("/volume", getVolumeData)
		progress.GET("/stats", getStats)
		progress.GET("/strength-trends", getStrengthTrends)
		progress.GET("/prs", getPRs)
		progress.GET("/heatmap", getHeatmap)
		progress.GET("/insights", getInsights)
	}
}

// getVolumeData handles GET /api/progress/volume
func getVolumeData(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := "single" // TODO: get from auth
	rangeParam := c.DefaultQuery("range", "last-30-days")

	endDate := time.Now()
	var startDate time.Time
	var dateFormat string
	var groupByPeriod bool

	switch rangeParam {
	case "last-7-days":
		startDate = endDate.AddDate(0, 0, -7)
		dateFormat = "%Y-%m-%d"
		groupByPeriod = false
	case "last-30-days":
		startDate = endDate.AddDate(0, 0, -30)
		dateFormat = "%Y-%m-%d"
		groupByPeriod = false
	case "last-90-days":
		startDate = endDate.AddDate(0, 0, -90)
		dateFormat = "%Y-W%U" // Week format
		groupByPeriod = true
	case "last-180-days":
		startDate = endDate.AddDate(0, 0, -180)
		dateFormat = "%Y-W%U" // Week format
		groupByPeriod = true
	case "last-365-days":
		startDate = endDate.AddDate(0, 0, -365)
		dateFormat = "%Y-%m" // Month format
		groupByPeriod = true
	case "last-3-months":
		startDate = endDate.AddDate(0, -3, 0)
		dateFormat = "%Y-W%U"
		groupByPeriod = true
	case "all-time":
		startDate = time.Unix(0, 0)
		dateFormat = "%Y-%m" // Month format
		groupByPeriod = true
	default:
		startDate = endDate.AddDate(0, 0, -30)
		dateFormat = "%Y-%m-%d"
		groupByPeriod = false
	}

	collection := db.GetCollection("workouts")
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"userId": userID,
			"date":   bson.M{"$gte": startDate, "$lte": endDate},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"$dateToString": bson.M{"format": dateFormat, "date": "$date"},
			},
			"totalVolume":  bson.M{"$sum": "$metrics.totalVolume"},
			"workoutCount": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch volume data"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse volume data"})
		return
	}

	// For grouped data (weekly/monthly), just return aggregated results
	if groupByPeriod {
		formattedData := []gin.H{}
		for _, item := range results {
			formattedData = append(formattedData, gin.H{
				"date":     item["_id"].(string),
				"volume":   item["totalVolume"],
				"workouts": item["workoutCount"],
			})
		}
		c.JSON(http.StatusOK, formattedData)
		return
	}

	// For daily data, fill in all days in the range
	dataMap := make(map[string]bson.M)
	for _, item := range results {
		dateStr := item["_id"].(string)
		dataMap[dateStr] = item
	}

	formattedData := []gin.H{}
	currentDate := startDate
	for currentDate.Before(endDate) || currentDate.Equal(endDate) {
		dateStr := currentDate.Format("2006-01-02")
		if data, exists := dataMap[dateStr]; exists {
			formattedData = append(formattedData, gin.H{
				"date":     dateStr,
				"volume":   data["totalVolume"],
				"workouts": data["workoutCount"],
			})
		} else {
			// Fill with zeros for missing days
			formattedData = append(formattedData, gin.H{
				"date":     dateStr,
				"volume":   0,
				"workouts": 0,
			})
		}
		currentDate = currentDate.AddDate(0, 0, 1)
	}

	c.JSON(http.StatusOK, formattedData)
}

// getStats handles GET /api/progress/stats
func getStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := "single"
	rangeParam := c.DefaultQuery("range", "last-7-days")

	endDate := time.Now()
	var startDate time.Time
	var prevStartDate time.Time

	switch rangeParam {
	case "last-7-days":
		startDate = endDate.AddDate(0, 0, -7)
		prevStartDate = startDate.AddDate(0, 0, -7)
	case "last-30-days":
		startDate = endDate.AddDate(0, 0, -30)
		prevStartDate = startDate.AddDate(0, 0, -30)
	case "last-90-days":
		startDate = endDate.AddDate(0, 0, -90)
		prevStartDate = startDate.AddDate(0, 0, -90)
	case "last-180-days":
		startDate = endDate.AddDate(0, 0, -180)
		prevStartDate = startDate.AddDate(0, 0, -180)
	case "last-365-days":
		startDate = endDate.AddDate(0, 0, -365)
		prevStartDate = startDate.AddDate(0, 0, -365)
	case "all-time":
		startDate = time.Unix(0, 0)
		prevStartDate = time.Unix(0, 0)
	default:
		startDate = endDate.AddDate(0, 0, -7)
		prevStartDate = startDate.AddDate(0, 0, -7)
	}

	collection := db.GetCollection("workouts")

	// Get current period stats
	currentPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"userId": userID,
			"date":   bson.M{"$gte": startDate, "$lte": endDate},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":          nil,
			"totalVolume":  bson.M{"$sum": "$metrics.totalVolume"},
			"totalSets":    bson.M{"$sum": "$metrics.numSets"},
			"workoutCount": bson.M{"$sum": 1},
		}}},
	}

	currentCursor, err := collection.Aggregate(ctx, currentPipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stats"})
		return
	}
	defer currentCursor.Close(ctx)

	var currentStats []bson.M
	if err := currentCursor.All(ctx, &currentStats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse stats"})
		return
	}

	// Get previous period for comparison
	prevPipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"userId": userID,
			"date":   bson.M{"$gte": prevStartDate, "$lt": startDate},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":          nil,
			"totalVolume":  bson.M{"$sum": "$metrics.totalVolume"},
			"workoutCount": bson.M{"$sum": 1},
		}}},
	}

	prevCursor, err := collection.Aggregate(ctx, prevPipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch previous stats"})
		return
	}
	defer prevCursor.Close(ctx)

	var prevStats []bson.M
	if err := prevCursor.All(ctx, &prevStats); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse previous stats"})
		return
	}

	current := gin.H{
		"totalVolume":  0.0,
		"workoutCount": 0,
		"totalSets":    0,
	}
	if len(currentStats) > 0 {
		current = gin.H(currentStats[0])
	}

	previous := gin.H{
		"totalVolume":  0.0,
		"workoutCount": 0,
	}
	if len(prevStats) > 0 {
		previous = gin.H(prevStats[0])
	}

	volumeChange := 0.0
	if prevVol, ok := previous["totalVolume"].(float64); ok && prevVol > 0 {
		if currVol, ok := current["totalVolume"].(float64); ok {
			volumeChange = ((currVol - prevVol) / prevVol) * 100
		}
	}

	workoutChange := 0.0
	if prevCount, ok := previous["workoutCount"].(int32); ok && prevCount > 0 {
		if currCount, ok := current["workoutCount"].(int32); ok {
			workoutChange = (float64(currCount-prevCount) / float64(prevCount)) * 100
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"totalVolume":   current["totalVolume"],
		"workouts":      current["workoutCount"],
		"volumeChange":  int(volumeChange),
		"workoutChange": int(workoutChange),
	})
}

// getStrengthTrends handles GET /api/progress/strength-trends
func getStrengthTrends(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := "single"
	rangeParam := c.DefaultQuery("range", "last-30-days")

	endDate := time.Now()
	var startDate time.Time

	switch rangeParam {
	case "last-7-days":
		startDate = endDate.AddDate(0, 0, -7)
	case "last-30-days":
		startDate = endDate.AddDate(0, 0, -30)
	case "last-90-days":
		startDate = endDate.AddDate(0, 0, -90)
	case "last-180-days":
		startDate = endDate.AddDate(0, 0, -180)
	case "last-365-days":
		startDate = endDate.AddDate(0, 0, -365)
	case "all-time":
		startDate = time.Unix(0, 0)
	default:
		startDate = endDate.AddDate(0, 0, -30)
	}

	collection := db.GetCollection("workouts")
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"userId": userID,
			"date":   bson.M{"$gte": startDate, "$lte": endDate},
		}}},
		{{Key: "$unwind", Value: "$exercises"}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"exerciseId": "$exercises.exerciseId",
				"date":       bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$date"}},
			},
			"maxWeight": bson.M{"$max": "$exercises.sets.weight"},
			"name":      bson.M{"$first": "$exercises.name"},
		}}},
		{{Key: "$sort", Value: bson.M{"_id.date": 1}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch strength trends"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse strength trends"})
		return
	}

	// Group by exercise
	groupedByExercise := make(map[string]gin.H)
	for _, item := range results {
		idMap := item["_id"].(bson.M)
		exID := idMap["exerciseId"].(primitive.ObjectID).Hex()

		if _, exists := groupedByExercise[exID]; !exists {
			groupedByExercise[exID] = gin.H{
				"exerciseId": exID,
				"name":       item["name"],
				"data":       []gin.H{},
			}
		}

		data := groupedByExercise[exID]["data"].([]gin.H)
		data = append(data, gin.H{
			"date":      idMap["date"],
			"maxWeight": item["maxWeight"],
		})
		groupedByExercise[exID]["data"] = data
	}

	result := make([]gin.H, 0, len(groupedByExercise))
	for _, v := range groupedByExercise {
		result = append(result, v)
	}

	c.JSON(http.StatusOK, result)
}

// getPRs handles GET /api/progress/prs
func getPRs(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := "single"
	collection := db.GetCollection("workouts")

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"userId": userID}}},
		{{Key: "$unwind", Value: "$exercises"}},
		{{Key: "$unwind", Value: "$exercises.sets"}},
		{{Key: "$group", Value: bson.M{
			"_id":           "$exercises.exerciseId",
			"name":          bson.M{"$first": "$exercises.name"},
			"maxWeight":     bson.M{"$max": "$exercises.sets.weight"},
			"totalSessions": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"maxWeight": -1}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch PRs"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse PRs"})
		return
	}

	c.JSON(http.StatusOK, results)
}

// getHeatmap handles GET /api/progress/heatmap
func getHeatmap(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID := "single"
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -90)

	collection := db.GetCollection("workouts")
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"userId": userID,
			"date":   bson.M{"$gte": startDate, "$lte": endDate},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":         bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$date"}},
			"count":       bson.M{"$sum": 1},
			"totalVolume": bson.M{"$sum": "$metrics.totalVolume"},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch heatmap data"})
		return
	}
	defer cursor.Close(ctx)

	var results []bson.M
	if err := cursor.All(ctx, &results); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse heatmap data"})
		return
	}

	heatmapData := make([]gin.H, len(results))
	for i, item := range results {
		count := item["count"].(int32)
		intensity := count * 20
		if intensity > 100 {
			intensity = 100
		}

		heatmapData[i] = gin.H{
			"date":      item["_id"],
			"count":     count,
			"volume":    item["totalVolume"],
			"intensity": intensity,
		}
	}

	c.JSON(http.StatusOK, heatmapData)
}

// getInsights handles GET /api/progress/insights
func getInsights(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	userID := "single"
	insights := []gin.H{}

	collection := db.GetCollection("workouts")

	// Get recent workouts
	opts := options.Find()
	opts.SetSort(bson.M{"date": -1})
	opts.SetLimit(30)

	cursor, err := collection.Find(ctx, bson.M{"userId": userID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch insights"})
		return
	}
	defer cursor.Close(ctx)

	var recentWorkouts []bson.M
	if err := cursor.All(ctx, &recentWorkouts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse workouts"})
		return
	}

	// Calculate streak
	streak := 0
	today := time.Now()
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

	for i := 0; i < len(recentWorkouts); i++ {
		workoutDate := recentWorkouts[i]["date"].(primitive.DateTime).Time()
		workoutDate = time.Date(workoutDate.Year(), workoutDate.Month(), workoutDate.Day(), 0, 0, 0, 0, workoutDate.Location())
		expectedDate := today.AddDate(0, 0, -i)

		if workoutDate.Equal(expectedDate) {
			streak++
		} else {
			break
		}
	}

	if streak >= 3 {
		insights = append(insights, gin.H{
			"type":    "success",
			"title":   "Amazing Streak!",
			"message": fmt.Sprintf("You've worked out %d days in a row. Keep it up!", streak),
		})
	}

	c.JSON(http.StatusOK, insights)
}
