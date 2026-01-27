import axios from "axios"

// API Base URL - Default points to PHP backend
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost/backend/api"

// Simple in-memory cache for API responses
const apiCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCacheKey = (url, params) => {
  const paramStr = params ? JSON.stringify(params) : ''
  return `${url}:${paramStr}`
}

const getFromCache = (key) => {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  apiCache.delete(key)
  return null
}

const setCache = (key, data) => {
  // Limit cache size
  if (apiCache.size > 100) {
    const firstKey = apiCache.keys().next().value
    apiCache.delete(firstKey)
  }
  apiCache.set(key, { data, timestamp: Date.now() })
}

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
   * Uses caching for improved performance
   */
  getTimeline: async () => {
    const cacheKey = getCacheKey("/events.php")
    const cached = getFromCache(cacheKey)
    if (cached) return cached
    
    try {
      const response = await apiClient.get("/events.php")

      // Backend returns: { success: true, count: 9, data: [...] }
      if (response.data.success) {
        const data = response.data.data || []
        const count = response.data.count || 0
        const result = {
          data: data,
          count: count,
        }
        setCache(cacheKey, result)
        return result
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
   * Uses caching for improved performance
   */
  getKeyMoments: async eventId => {
    const cacheKey = getCacheKey("/key_moments_simple.php", { event_id: eventId })
    const cached = getFromCache(cacheKey)
    if (cached) return cached
    
    try {
      // Try simple version first (exact copy of events.php structure)
      const response = await apiClient.get(
        `/key_moments_simple.php?event_id=${eventId}`
      )
      if (response.data.success) {
        const result = {
          data: response.data.data || [],
          count: response.data.count || 0,
        }
        setCache(cacheKey, result)
        return result
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
   * Uses caching for improved performance
   */
  getEventSections: async eventId => {
    const cacheKey = getCacheKey("/event_sections_direct.php", { event_id: eventId })
    const cached = getFromCache(cacheKey)
    if (cached) return cached
    
    try {
      // Use direct endpoint directly (routing doesn't work reliably)
      const response = await apiClient.get(
        `/event_sections_direct.php?event_id=${eventId}`
      )
      if (response.data.success) {
        const result = {
          data: response.data.data || [],
        }
        setCache(cacheKey, result)
        return result
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
   * Uses caching for improved performance
   */
  getEventMedia: async eventId => {
    const cacheKey = getCacheKey("/event_media_direct.php", { event_id: eventId })
    const cached = getFromCache(cacheKey)
    if (cached) return cached
    
    try {
      // Use direct endpoint directly (routing doesn't work reliably)
      const response = await apiClient.get(
        `/event_media_direct.php?event_id=${eventId}`
      )
      if (response.data.success) {
        const result = {
          data: response.data.data || [],
          count: response.data.count || 0,
        }
        setCache(cacheKey, result)
        return result
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
   * Get all puzzle images from events
   * Maps to: GET /api/puzzle-images
   */
  getPuzzleImages: async (excludeId = null) => {
    try {
      const url = excludeId 
        ? `/puzzle-images?exclude_id=${excludeId}`
        : "/puzzle-images"
      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error("Failed to get puzzle images:", error.message)
      return { success: false, puzzleImages: [] }
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
   * Uses caching for improved performance
   */
  getQuizQuestions: async (eventId = null) => {
    const cacheKey = getCacheKey("/quiz_questions.php", { event_id: eventId })
    const cached = getFromCache(cacheKey)
    if (cached) return cached
    
    try {
      const url = eventId 
        ? `/quiz_questions.php?event_id=${eventId}`
        : "/quiz_questions.php"
      const response = await apiClient.get(url)
      if (response.data.success) {
        setCache(cacheKey, response.data)
      }
      return response.data
    } catch (error) {
      console.error("Failed to get quiz questions:", error.message)
      return { success: false, questions: [] }
    }
  },

  /**
   * Get quiz high scores (filtered by event_id and difficulty)
   * Maps to: GET /api/quiz_scores.php
   */
  getQuizScores: async (eventId = null, difficulty = null) => {
    try {
      const params = new URLSearchParams()
      if (eventId !== null) params.append('event_id', eventId)
      if (difficulty !== null) params.append('difficulty', difficulty)
      
      const queryString = params.toString()
      const url = queryString ? `/quiz_scores.php?${queryString}` : "/quiz_scores.php"
      
      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error("Failed to get quiz scores:", error.message)
      return { success: false, scores: [] }
    }
  },

  /**
   * Save quiz score (with event_id and difficulty)
   * Maps to: POST /api/quiz_scores.php
   */
  saveQuizScore: async (playerName, score, totalQuestions, eventId = null, difficulty = 'easy') => {
    try {
      const response = await apiClient.post("/quiz_scores.php", {
        player_name: playerName,
        score: score,
        total_questions: totalQuestions,
        event_id: eventId,
        difficulty: difficulty
      })
      return response.data
    } catch (error) {
      console.error("Failed to save quiz score:", error.message)
      // The interceptor may have already extracted the message
      // Try to get the original response data first, otherwise use error.message
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message }
      }
      // Error.message may contain the Dutch message from the interceptor
      return { success: false, message: error.message || "Kon score niet opslaan" }
    }
  },
}

export default api
