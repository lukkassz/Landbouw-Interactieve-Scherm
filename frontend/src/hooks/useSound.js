import { useRef, useEffect, useCallback } from "react"

// Import sound files
import buttonClickSound from "../assets/sounds/button-click-289742.mp3"
import correctSound from "../assets/sounds/correct_sound.wav"

// Sound types available
export const SOUND_TYPES = {
  CLICK: 'click',
  SUCCESS: 'success',
  ERROR: 'error',
  WHOOSH: 'whoosh',
}

// Global audio pools for instant playback
const audioPools = {
  click: [],
  success: [],
}
let audioPoolsReady = false
const POOL_SIZE = 3

// Sound configurations
const SOUND_CONFIG = {
  click: { src: buttonClickSound, volume: 0.25, duration: 200 },
  success: { src: correctSound, volume: 0.3, duration: 500 },
}

// Initialize audio pools once (singleton pattern)
const initAudioPools = () => {
  if (audioPoolsReady || typeof window === "undefined") return
  
  Object.keys(SOUND_CONFIG).forEach(type => {
    const config = SOUND_CONFIG[type]
    audioPools[type] = []
    
    for (let i = 0; i < POOL_SIZE; i++) {
      const audio = new Audio()
      audio.src = config.src
      audio.volume = config.volume
      audio.preload = "auto"
      audio.load()
      audioPools[type].push({ audio, playing: false, duration: config.duration })
    }
  })
  
  audioPoolsReady = true
}

// Preload on module import
if (typeof window !== "undefined") {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initAudioPools())
  } else {
    setTimeout(() => initAudioPools(), 100)
  }
}

/**
 * Hook to play sound effects on user interactions
 * Uses audio pools for instant playback without delay
 * @param {boolean} enabled - Whether sound is enabled (default: true)
 * @returns {Object} { playSound, playClick, playSuccess }
 */
export const useSound = (enabled = true) => {
  const lastPlayedRef = useRef({})
  
  // Ensure pools are initialized
  useEffect(() => {
    initAudioPools()
  }, [])

  /**
   * Play a specific sound type
   */
  const playSoundType = useCallback((type = 'click') => {
    if (!enabled || !audioPoolsReady) return
    
    const pool = audioPools[type]
    if (!pool || pool.length === 0) return
    
    // Throttle: minimum 50ms between same sound type
    const now = Date.now()
    if (lastPlayedRef.current[type] && now - lastPlayedRef.current[type] < 50) return
    lastPlayedRef.current[type] = now
    
    // Find an available audio element from pool
    const available = pool.find(item => !item.playing)
    if (available) {
      available.playing = true
      available.audio.currentTime = 0
      available.audio.play()
        .then(() => {
          setTimeout(() => {
            available.playing = false
          }, available.duration + 100)
        })
        .catch(() => {
          available.playing = false
        })
    }
  }, [enabled])

  // Convenience methods
  const playSound = useCallback(() => playSoundType('click'), [playSoundType])
  const playClick = useCallback(() => playSoundType('click'), [playSoundType])
  const playSuccess = useCallback(() => playSoundType('success'), [playSoundType])

  return { 
    playSound,      // Default click sound (backward compatible)
    playClick,      // Explicit click sound
    playSuccess,    // Success/correct sound
    playSoundType,  // Play any sound type
  }
}

// Default export for backward compatibility
export default useSound







