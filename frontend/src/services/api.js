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
      throw new Error("Resource not found")
    } else if (error.response?.status === 500) {
      throw new Error("Server error occurred")
    } else if (error.code === "ECONNREFUSED") {
      throw new Error("Unable to connect to server")
    }
    throw new Error(error.response?.data?.message || "An error occurred")
  }
)

export const api = {
  /**
   * Get all timeline events
   * Maps to: GET /api/events
   */
  getTimeline: async () => {
    try {
      console.log(`Fetching from: ${API_BASE_URL}/events.php`)
      const response = await apiClient.get("/events.php")
      console.log("API response status:", response.status)
      console.log("API response data:", response.data)

      // Backend returns: { success: true, count: 9, data: [...] }
      if (response.data.success) {
        const data = response.data.data || []
        const count = response.data.count || 0
        console.log(`API returned ${count} events`)
        return {
          data: data,
          count: count,
        }
      }
      throw new Error(response.data.message || "Failed to fetch events")
    } catch (error) {
      console.error("Timeline API error:", error.message)
      console.error("Error details:", {
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      })

      // If it's a connection error, show helpful message
      if (error.code === "ECONNREFUSED" || error.message.includes("connect")) {
        throw new Error(
          `Cannot connect to API at ${API_BASE_URL}. Make sure the backend server is running.`
        )
      }

      // Re-throw the error so useTimeline can handle it
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
   * Maps to: GET /api/event/{id}/sections
   */
  getEventSections: async eventId => {
    try {
      const response = await apiClient.get(`/event/${eventId}/sections`)
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
   * Maps to: GET /api/event/{id}/media
   */

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
}

export default api
