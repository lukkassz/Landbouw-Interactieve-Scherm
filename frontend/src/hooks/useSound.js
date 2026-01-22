import { useRef, useEffect, useCallback } from "react"

// Import sound file
import buttonClickSound from "../assets/sounds/button-click-289742.mp3"

// Global audio pool for instant playback
let audioPool = []
let audioPoolReady = false
const POOL_SIZE = 3

// Initialize audio pool once (singleton pattern)
const initAudioPool = () => {
  if (audioPoolReady || typeof window === "undefined") return
  
  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio()
    audio.src = buttonClickSound
    audio.volume = 0.3
    audio.preload = "auto"
    // Force load
    audio.load()
    audioPool.push({ audio, playing: false })
  }
  audioPoolReady = true
}

// Preload on module import
if (typeof window !== "undefined") {
  // Use requestIdleCallback or setTimeout for non-blocking init
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initAudioPool())
  } else {
    setTimeout(() => initAudioPool(), 100)
  }
}

/**
 * Hook to play sound effects on user interactions
 * Uses an audio pool for instant playback without delay
 * @param {boolean} enabled - Whether sound is enabled (default: true)
 * @returns {Function} playSound - Function to play the sound
 */
export const useSound = (enabled = true) => {
  const lastPlayedRef = useRef(0)
  
  // Ensure pool is initialized
  useEffect(() => {
    initAudioPool()
  }, [])

  /**
   * Play the sound effect using audio pool
   */
  const playSound = useCallback(() => {
    if (!enabled || !audioPoolReady) return
    
    // Throttle: minimum 50ms between plays
    const now = Date.now()
    if (now - lastPlayedRef.current < 50) return
    lastPlayedRef.current = now
    
    // Find an available audio element from pool
    const available = audioPool.find(item => !item.playing)
    if (available) {
      available.playing = true
      available.audio.currentTime = 0
      available.audio.play()
        .then(() => {
          // Mark as available after sound finishes (short sound ~200ms)
          setTimeout(() => {
            available.playing = false
          }, 300)
        })
        .catch(() => {
          available.playing = false
        })
    }
  }, [enabled])

  return playSound
}











