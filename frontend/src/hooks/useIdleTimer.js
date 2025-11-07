import { useEffect, useRef, useCallback } from "react"

/**
 * Custom hook for managing idle timeout
 * @param {number} timeout - Timeout in milliseconds (default: 45000 = 45 seconds)
 * @param {Function} onIdle - Callback function called when idle timeout is reached
 * @param {boolean} enabled - Whether the timer is enabled (default: true)
 * @returns {Function} resetTimer - Function to reset the idle timer
 */
export const useIdleTimer = (timeout = 45000, onIdle, enabled = true) => {
  const timeoutRef = useRef(null)
  const isEnabledRef = useRef(enabled)
  const onIdleRef = useRef(onIdle)

  // Update refs whenever they change
  useEffect(() => {
    isEnabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    onIdleRef.current = onIdle
  }, [onIdle])

  // Reset timer function - stable, doesn't depend on onIdle
  const resetTimer = useCallback(() => {
    if (!isEnabledRef.current) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (isEnabledRef.current && onIdleRef.current) {
        onIdleRef.current()
      }
    }, timeout)
  }, [timeout]) // Only timeout as dependency

  // Setup event listeners
  useEffect(() => {
    if (!enabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Events that reset the timer
    const events = ["click", "touchstart", "scroll", "mousemove", "keypress"]

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true })
    })

    // Start the timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, resetTimer])

  return resetTimer
}

