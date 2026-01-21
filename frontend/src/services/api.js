import axios from "axios"

// API Base URL - Default points to PHP backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost/backend/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  config => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to ${config.url}`
    )
    return config
  },
  error => {
    console.error("Request error:", error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.error("Response error:", error)
    if (error.response?.status === 404) {
      throw new Error("Bron niet gevonden")
    } else if (error.response?.status === 500) {
      throw new Error("Serverfout opgetreden")
    } else if (error.code === "ECONNREFUSED") {
      throw new Error("Kan niet verbinden met server")
    }
    throw new Error(error.response?.data?.message || "Er is een fout opgetreden")
  }
)

export const api = {
  /**
   * Get all timeline events
   * Maps to: GET /api/events
   */
  getTimeline: async () => {
    try {
      const response = await apiClient.get("/events.php")

      // Backend returns: { success: true, count: 9, data: [...] }
      if (response.data.success) {
        const data = response.data.data || []
        const count = response.data.count || 0
        return {
          data: data,
          count: count,
        }
      }
      throw new Error(response.data.message || "Kon events niet ophalen")
    } catch (error) {
      // Log errors for debugging but don't spam console
      if (process.env.NODE_ENV === 'development') {
        console.error("Timeline API error:", error.message)
      }

      // If it's a connection error, show helpful message
      if (error.code === "ECONNREFUSED" || error.message.includes("connect")) {
        throw new Error(
          `Kan niet verbinden met API op ${API_BASE_URL}. Zorg ervoor dat de backend server draait.`
        )
      }

      // Re-throw the error so useTimeline can handle it
      throw error
    }
  },

  /**
   * Get key moments for an event
   * Uses direct endpoint (more reliable than routing)
   * Maps to: GET /api/key_moments_direct.php?event_id={id}
   */
  getKeyMoments: async eventId => {
    try {
      // Try simple version first (exact copy of events.php structure)
      const response = await apiClient.get(
        `/key_moments_simple.php?event_id=${eventId}`
      )
      if (response.data.success) {
        return {
          data: response.data.data || [],
          count: response.data.count || 0,
        }
      }
      throw new Error(response.data.message || "Failed to fetch key moments")
    } catch (error) {
      console.error("Key moments API error:", error.message)
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      // Return empty array if not found (event might not have key moments)
      if (error.response?.status === 404 || error.response?.status === 400) {
        return { data: [], count: 0 }
      }
      // For 500 errors, log details and return empty array to prevent UI breaking
      if (error.response?.status === 500) {
        console.error("Key moments endpoint returned 500:")
        console.error("Error response:", error.response?.data)
        console.warn("Returning empty array to prevent UI breaking")
        return { data: [], count: 0 }
      }
      throw error
    }
  },

  /**
   * Get single event by ID with sections and media
   * Maps to: GET /api/event?id={id}
   */
  getEventById: async id => {
    try {
      const response = await apiClient.get(`/event?id=${id}`)
      if (response.data.success) {
        return {
          data: response.data.data,
        }
      }
      throw new Error(response.data.message || "Event not found")
    } catch (error) {
      console.error("Failed to fetch event:", error.message)
      throw error
    }
  },

  /**
   * Get event sections for a specific event
   * Uses direct endpoint: GET /api/event_sections_direct.php?event_id={id}
   * (Direct endpoint works reliably, routing has issues)
   */
  getEventSections: async eventId => {
    try {
      // Use direct endpoint directly (routing doesn't work reliably)
      const response = await apiClient.get(
        `/event_sections_direct.php?event_id=${eventId}`
      )
      if (response.data.success) {
        return {
          data: response.data.data || [],
        }
      }
      throw new Error(response.data.message || "Failed to fetch sections")
    } catch (error) {
      console.warn("Sections API not available:", error.message)
      return { data: [] }
    }
  },

  /**
   * Get event media for a specific event
   * Uses direct endpoint: GET /api/event_media_direct.php?event_id={id}
   * (Direct endpoint works reliably, routing has issues)
   */
  getEventMedia: async eventId => {
    try {
      // Use direct endpoint directly (routing doesn't work reliably)
      const response = await apiClient.get(
        `/event_media_direct.php?event_id=${eventId}`
      )
      if (response.data.success) {
        return {
          data: response.data.data || [],
          count: response.data.count || 0,
        }
      }
      throw new Error(response.data.message || "Failed to fetch media")
    } catch (error) {
      console.warn("Media API not available:", error.message)
      return { data: [], count: 0 }
    }
  },

  // Legacy method - kept for compatibility, maps to getEventById
  getContentById: async id => {
    return api.getEventById(id)
  },

  /**
   * Create new event (Admin only)
   * Maps to: POST /api/event
   */
  createEvent: async eventData => {
    try {
      const response = await apiClient.post("/event", eventData)
      if (response.data.success) {
        return {
          data: response.data,
          id: response.data.id,
        }
      }
      throw new Error(response.data.message || "Failed to create event")
    } catch (error) {
      console.error("Failed to create event:", error.message)
      throw error
    }
  },

  /**
   * Update existing event (Admin only)
   * Maps to: PUT /api/event
   */
  updateEvent: async eventData => {
    try {
      const response = await apiClient.put("/event", eventData)
      if (response.data.success) {
        return {
          data: response.data,
        }
      }
      throw new Error(response.data.message || "Failed to update event")
    } catch (error) {
      console.error("Failed to update event:", error.message)
      throw error
    }
  },

  /**
   * Delete event (Admin only)
   * Maps to: DELETE /api/event?id={id}
   */
  deleteEvent: async id => {
    try {
      const response = await apiClient.delete(`/event?id=${id}`)
      if (response.data.success) {
        return {
          data: response.data,
        }
      }
      throw new Error(response.data.message || "Failed to delete event")
    } catch (error) {
      console.error("Failed to delete event:", error.message)
      throw error
    }
  },

  // Legacy methods for compatibility
  createContent: async contentData => {
    return api.createEvent(contentData)
  },

  updateContent: async (id, contentData) => {
    return api.updateEvent({ ...contentData, id })
  },

  deleteContent: async id => {
    return api.deleteEvent(id)
  },

  getDashboardStats: async () => {
    try {
      const response = await apiClient.get("/admin/stats")
      return response
    } catch (error) {
      console.warn("Stats API not available, using mock data")
      return {
        data: {
          totalContent: 12,
          totalVisits: 1547,
          recentActivities: [
            {
              description: "New content added: Industrial Revolution",
              timestamp: "2 hours ago",
            },
            {
              description: "Timeline updated with new artifacts",
              timestamp: "1 day ago",
            },
            {
              description: "System backup completed successfully",
              timestamp: "2 days ago",
            },
          ],
        },
      }
    }
  },

  uploadImage: async file => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await apiClient.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response
  },

  /**
   * Get puzzle image URL
   * Maps to: GET /api/puzzle_image_direct.php?filename={filename}
   */
  getPuzzleImageUrl: async filename => {
    try {
      const response = await apiClient.get(
        `/puzzle_image_direct.php?filename=${encodeURIComponent(filename)}`
      )
      if (response.data.success) {
        return response.data
      }
      throw new Error(response.data.message || "Failed to get puzzle image URL")
    } catch (error) {
      console.error("Failed to get puzzle image URL:", error.message)
      throw error
    }
  },

  /**
   * Get puzzle high scores
   * Maps to: GET /api/puzzle_scores.php
   */
  getPuzzleScores: async (difficulty = null) => {
    try {
      const url = difficulty 
        ? `/puzzle_scores.php?difficulty=${difficulty}`
        : "/puzzle_scores.php"
      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error("Failed to get puzzle scores:", error.message)
      return { success: false, scores: [] }
    }
  },

  /**
   * Save puzzle score
   * Maps to: POST /api/puzzle_scores.php
   */
  savePuzzleScore: async (playerName, moves, difficulty = 'easy') => {
    try {
      const response = await apiClient.post("/puzzle_scores.php", {
        player_name: playerName,
        moves: moves,
        difficulty: difficulty
      })
      return response.data
    } catch (error) {
      console.error("Failed to save puzzle score:", error.message)
      if (error.response?.data) {
        return error.response.data
      }
      return { success: false, message: "Failed to save score" }
    }
  },

  /**
   * Get memory game high scores
   * Maps to: GET /api/memory_scores.php
   */
  getMemoryScores: async () => {
    try {
      const response = await apiClient.get("/memory_scores.php")
      return response.data
    } catch (error) {
      console.error("Failed to get memory scores:", error.message)
      return { success: false, scores: [] }
    }
  },

  /**
   * Save memory game score
   * Maps to: POST /api/memory_scores.php
   */
  saveMemoryScore: async (playerName, moves, timeSeconds) => {
    try {
      const response = await apiClient.post("/memory_scores.php", {
        player_name: playerName,
        moves: moves,
        time_seconds: timeSeconds
      })
      return response.data
    } catch (error) {
      console.error("Failed to save memory score:", error.message)
      if (error.response?.data) {
        return error.response.data
      }
      return { success: false, message: "Failed to save score" }
    }
  },

  /**
   * Get quiz questions (optionally filtered by event_id)
   * Maps to: GET /api/quiz_questions.php
   */
  getQuizQuestions: async (eventId = null) => {
    try {
      const url = eventId 
        ? `/quiz_questions.php?event_id=${eventId}`
        : "/quiz_questions.php"
      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error("Failed to get quiz questions:", error.message)
      return { success: false, questions: [] }
    }
  },

  /**
   * Get quiz high scores
   * Maps to: GET /api/quiz_scores.php
   */
  getQuizScores: async () => {
    try {
      const response = await apiClient.get("/quiz_scores.php")
      return response.data
    } catch (error) {
      console.error("Failed to get quiz scores:", error.message)
      return { success: false, scores: [] }
    }
  },

  /**
   * Save quiz score
   * Maps to: POST /api/quiz_scores.php
   */
  saveQuizScore: async (playerName, score, totalQuestions) => {
    try {
      const response = await apiClient.post("/quiz_scores.php", {
        player_name: playerName,
        score: score,
        total_questions: totalQuestions
      })
      return response.data
    } catch (error) {
      console.error("Failed to save quiz score:", error.message)
      if (error.response?.data) {
        return error.response.data
      }
      return { success: false, message: "Failed to save score" }
    }
  },
}

export default api
