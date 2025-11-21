import { API_BASE_URL } from "../config/env";
import mockData from "./mockData.json";

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
  private isOfflineMode: boolean = false;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(`${this.baseUrl}/api/exercises?limit=1`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        console.log("✅ Backend connected");
        return true;
      }
      console.log("⚠️ Backend returned:", response.status);
      return false;
    } catch (error) {
      console.log("🔄 Backend not available, using demo mode");
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Check if backend is available on first request
    if (!this.isOfflineMode) {
      const isBackendUp = await this.checkBackendHealth();
      if (!isBackendUp) {
        this.isOfflineMode = true;
        console.log("Demo mode activated");
      }
    }

    // If in offline mode, return mock data
    if (this.isOfflineMode) {
      return this.getMockResponse<T>(endpoint);
    }

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
      // Fall back to demo mode on error
      this.isOfflineMode = true;
      return this.getMockResponse<T>(endpoint);
    }
  }

  private getMockResponse<T>(endpoint: string): T {
    console.log("Using mock data for:", endpoint);

    if (endpoint.includes("/api/exercises")) {
      return { documents: mockData.exercises } as T;
    }

    if (endpoint.includes("/api/workouts")) {
      return { documents: mockData.workouts } as T;
    }

    if (endpoint.includes("/api/progress/volume")) {
      return mockData.volumeData as T;
    }

    if (endpoint.includes("/api/progress/stats")) {
      return mockData.stats as T;
    }

    if (endpoint.includes("/api/progress/strength-trends")) {
      return mockData.strengthTrends as T;
    }

    if (endpoint.includes("/api/progress/prs")) {
      return mockData.prs as T;
    }

    if (endpoint.includes("/api/progress/heatmap")) {
      return mockData.heatmap as T;
    }

    if (endpoint.includes("/api/progress/insights")) {
      return mockData.insights as T;
    }

    // Default response
    return { documents: [] } as T;
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
    muscleSplit: Array<{ _id: string; volume: number }>;
  }> {
    return this.request(`/api/progress/stats${range ? `?range=${range}` : ""}`);
  }

  async getStrengthTrends(range?: string): Promise<
    Array<{
      exerciseId: string;
      name: string;
      targetMuscle?: string[];
      data: Array<{ date: string; maxWeight: number; volume: number; est1RM: number }>;
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
