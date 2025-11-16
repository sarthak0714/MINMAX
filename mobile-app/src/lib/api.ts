import { API_BASE_URL } from "../config/env";

export interface Exercise {
  _id: string;
  name: string;
  targetMuscle: string[];
  meta: string[];
  slug: string;
  createdAt: string;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
  isWarmup: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  slug: string;
  sets: WorkoutSet[];
}

export interface Workout {
  _id: string;
  userId: string;
  date: string;
  title?: string;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
  updatedAt: string;
  metrics?: {
    totalVolume?: number;
    numSets: number;
    durationMin?: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log("API Request:", url);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      console.log("API Response:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        console.error("API Error:", error);
        throw new Error(error.error || error.message || "Request failed");
      }

      return response.json();
    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;
    }
  }

  // Exercises
  async getExercises(): Promise<{ documents: Exercise[] }> {
    return this.request("/api/exercises");
  }

  async createExercise(data: {
    name: string;
    targetMuscle?: string[];
    meta?: string[];
  }): Promise<{ document: Exercise }> {
    return this.request("/api/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExercise(
    id: string,
    data: Partial<Exercise>
  ): Promise<{ document: Exercise }> {
    return this.request(`/api/exercises/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteExercise(id: string): Promise<{ message: string }> {
    return this.request(`/api/exercises/${id}`, {
      method: "DELETE",
    });
  }

  // Workouts
  async getWorkouts(params?: {
    userId?: string;
    date?: string;
  }): Promise<{ documents: Workout[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/workouts${query ? `?${query}` : ""}`);
  }

  async getWorkout(id: string): Promise<{ document: Workout }> {
    return this.request(`/api/workouts/${id}`);
  }

  async createWorkout(data: {
    userId: string;
    date: string;
    title?: string;
    notes?: string;
    exercises: WorkoutExercise[];
  }): Promise<{ document: Workout }> {
    return this.request("/api/workouts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWorkout(
    id: string,
    data: Partial<Workout>
  ): Promise<{ document: Workout }> {
    return this.request(`/api/workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteWorkout(id: string): Promise<{ message: string }> {
    return this.request(`/api/workouts/${id}`, {
      method: "DELETE",
    });
  }

  // Progress
  async getVolumeData(range?: string): Promise<
    Array<{
      date: string;
      volume: number;
      workouts: number;
    }>
  > {
    return this.request(
      `/api/progress/volume${range ? `?range=${range}` : ""}`
    );
  }

  async getStats(range?: string): Promise<{
    totalVolume: number;
    workouts: number;
    avgWeight: number;
    volumeChange: number;
    workoutChange: number;
  }> {
    return this.request(`/api/progress/stats${range ? `?range=${range}` : ""}`);
  }

  async getStrengthTrends(range?: string): Promise<
    Array<{
      exerciseId: string;
      name: string;
      targetMuscle?: string[];
      data: Array<{ date: string; maxWeight: number; volume: number }>;
    }>
  > {
    return this.request(
      `/api/progress/strength-trends${range ? `?range=${range}` : ""}`
    );
  }

  async getPRs(): Promise<
    Array<{
      _id: string;
      name: string;
      maxWeight: number;
      totalSessions: number;
    }>
  > {
    return this.request("/api/progress/prs");
  }

  async getHeatmap(): Promise<
    Array<{
      date: string;
      count: number;
      volume: number;
      intensity: number;
    }>
  > {
    return this.request("/api/progress/heatmap");
  }

  async getInsights(): Promise<
    Array<{
      type: string;
      title: string;
      message: string;
    }>
  > {
    return this.request("/api/progress/insights");
  }
}

console.log("API Base URL:", API_BASE_URL);
export const apiClient = new ApiClient(API_BASE_URL);
