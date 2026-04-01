import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

const apiCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

const getCacheKey = (url, params) => `${url}:${JSON.stringify(params || {})}`

const getFromCache = key => {
  const cached = apiCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    apiCache.delete(key)
    return null
  }
  return cached.data
}

const setCache = (key, data) => {
  if (apiCache.size > 100) {
    const firstKey = apiCache.keys().next().value
    apiCache.delete(firstKey)
  }
  apiCache.set(key, { data, timestamp: Date.now() })
}

const clearCache = () => {
  apiCache.clear()
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const toMessage = error => {
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.message) return error.message
  return "An unexpected error occurred"
}

const asArray = value => (Array.isArray(value) ? value : [])

const findRank = (items, predicate) => {
  const index = items.findIndex(predicate)
  return index >= 0 ? index + 1 : null
}

const getWithCache = async (url, params) => {
  const cacheKey = getCacheKey(url, params)
  const cached = getFromCache(cacheKey)
  if (cached) return cached

  const { data } = await apiClient.get(url, { params })
  setCache(cacheKey, data)
  return data
}

export const api = {
  getTimeline: async () => {
    const data = await getWithCache("/events")
    const items = asArray(data)
    return { success: true, data: items, count: items.length }
  },

  getKeyMoments: async eventId => {
    const data = await getWithCache("/key_moments_simple", { event_id: eventId })
    const items = asArray(data)
    return { success: true, data: items, count: items.length }
  },

  getEventById: async id => {
    const { data } = await apiClient.get("/event", { params: { id } })
    return { success: true, data }
  },

  getEventSections: async eventId => {
    const data = await getWithCache("/event_sections_direct", { event_id: eventId })
    return { success: true, data: asArray(data) }
  },

  getEventMedia: async eventId => {
    const data = await getWithCache("/event_media_direct", { event_id: eventId })
    const items = asArray(data)
    return { success: true, data: items, count: items.length }
  },

  getContentById: async id => api.getEventById(id),

  createEvent: async eventData => {
    const { data } = await apiClient.post("/event", eventData)
    clearCache()
    return { success: true, data, id: data?.id ?? null }
  },

  updateEvent: async eventData => {
    const { data } = await apiClient.put("/event", eventData)
    clearCache()
    return { success: true, data }
  },

  deleteEvent: async id => {
    const { data } = await apiClient.delete("/event", { params: { id } })
    clearCache()
    return { success: true, data }
  },

  createContent: async contentData => api.createEvent(contentData),

  updateContent: async (id, contentData) => api.updateEvent({ ...contentData, id }),

  deleteContent: async id => api.deleteEvent(id),

  getDashboardStats: async () => ({
    data: {
      totalContent: 0,
      totalVisits: 0,
      recentActivities: [],
    },
  }),

  uploadImage: async file => {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await apiClient.post("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return { success: true, ...data, imageUrl: data?.url || "" }
  },

  getPuzzleImageUrl: async filename => {
    const { data } = await apiClient.get("/puzzle_image_direct", {
      params: { filename },
    })
    return { success: true, url: data?.url || "" }
  },

  getPuzzleScores: async (difficulty = null) => {
    const { data } = await apiClient.get("/puzzle_scores", {
      params: difficulty ? { difficulty } : undefined,
    })
    return { success: true, scores: asArray(data) }
  },

  savePuzzleScore: async (playerName, moves, difficulty = "easy") => {
    const { data } = await apiClient.post("/puzzle_scores", {
      player_name: playerName,
      moves,
      difficulty,
    })

    if (!data?.qualified) {
      return {
        success: false,
        qualified: false,
        message: data?.message || "Score did not qualify for leaderboard",
      }
    }

    const leaderboard = await api.getPuzzleScores(difficulty)
    const rank = findRank(
      leaderboard.scores,
      item => item.player_name === playerName && Number(item.moves) === Number(moves)
    )

    return {
      success: true,
      qualified: true,
      rank,
      scores: leaderboard.scores,
      message: data?.message || "Score saved",
    }
  },

  getPuzzleImages: async (excludeId = null) => {
    const { data } = await apiClient.get("/puzzle-images")
    const images = asArray(data)
      .filter(item => (excludeId == null ? true : Number(item.id) !== Number(excludeId)))
      .map(item => ({
        id: item.id,
        eventId: item.id,
        title: item.title || "Untitled",
        imageUrl: item.puzzle_image_url || "",
      }))
      .filter(item => item.imageUrl)

    return { success: true, puzzleImages: images }
  },

  getMemoryScores: async () => {
    const { data } = await apiClient.get("/memory_scores")
    return { success: true, scores: asArray(data) }
  },

  saveMemoryScore: async (playerName, moves, timeSeconds) => {
    const { data } = await apiClient.post("/memory_scores", {
      player_name: playerName,
      moves,
      time_seconds: timeSeconds,
    })

    if (!data?.qualified) {
      return {
        success: false,
        qualified: false,
        message: data?.message || "Score did not qualify for leaderboard",
      }
    }

    const leaderboard = await api.getMemoryScores()
    const rank = findRank(
      leaderboard.scores,
      item =>
        item.player_name === playerName &&
        Number(item.moves) === Number(moves) &&
        Number(item.time_seconds) === Number(timeSeconds)
    )

    return {
      success: true,
      qualified: true,
      rank,
      scores: leaderboard.scores,
      message: data?.message || "Score saved",
    }
  },

  getQuizQuestions: async (eventId = null) => {
    const { data } = await apiClient.get("/quiz_questions", {
      params: eventId != null ? { event_id: eventId } : undefined,
    })

    return { success: true, questions: asArray(data) }
  },

  getQuizScores: async (eventId = null, difficulty = null) => {
    const params = {}
    if (eventId != null) params.event_id = eventId
    if (difficulty != null) params.difficulty = difficulty

    const { data } = await apiClient.get("/quiz_scores", {
      params: Object.keys(params).length > 0 ? params : undefined,
    })

    return { success: true, scores: asArray(data) }
  },

  saveQuizScore: async (
    playerName,
    score,
    totalQuestions,
    eventId = null,
    difficulty = "easy"
  ) => {
    const { data } = await apiClient.post("/quiz_scores", {
      player_name: playerName,
      score,
      total_questions: totalQuestions,
      event_id: eventId,
      difficulty,
    })

    if (!data?.qualified) {
      return {
        success: false,
        qualified: false,
        message: data?.message || "Score did not qualify for leaderboard",
      }
    }

    const leaderboard = await api.getQuizScores(eventId, difficulty)
    const percentage = Math.round((Number(score) / Number(totalQuestions)) * 100)
    const rank = findRank(
      leaderboard.scores,
      item =>
        item.player_name === playerName &&
        Number(item.score) === Number(score) &&
        Number(item.percentage) === percentage
    )

    return {
      success: true,
      qualified: true,
      rank,
      scores: leaderboard.scores,
      message: data?.message || "Score saved",
    }
  },
}

apiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(new Error(toMessage(error)))
)

export default api
