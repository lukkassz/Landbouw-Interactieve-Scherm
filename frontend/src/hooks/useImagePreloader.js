import { useEffect, useRef, useCallback } from "react"

/**
 * Cache for preloaded images
 * Uses a Map to store Image objects
 */
const imageCache = new Map()
const loadingImages = new Set()

/**
 * Preload a single image
 * @param {string} src - Image URL to preload
 * @returns {Promise<HTMLImageElement>}
 */
export const preloadImage = (src) => {
  if (!src || typeof src !== 'string') return Promise.resolve(null)
  
  // Return cached image if available
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src))
  }
  
  // Return existing promise if already loading
  if (loadingImages.has(src)) {
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (imageCache.has(src)) {
          clearInterval(checkLoaded)
          resolve(imageCache.get(src))
        }
      }, 50)
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded)
        resolve(null)
      }, 10000)
    })
  }
  
  loadingImages.add(src)
  
  return new Promise((resolve) => {
    const img = new Image()
    
    img.onload = () => {
      imageCache.set(src, img)
      loadingImages.delete(src)
      resolve(img)
    }
    
    img.onerror = () => {
      loadingImages.delete(src)
      resolve(null)
    }
    
    // Use crossOrigin for external images
    if (src.startsWith('http') && !src.includes(window.location.hostname)) {
      img.crossOrigin = 'anonymous'
    }
    
    img.src = src
  })
}

/**
 * Preload multiple images with priority queue
 * @param {string[]} urls - Array of image URLs
 * @param {Object} options - Options
 * @param {number} options.concurrency - Max concurrent loads (default: 4)
 * @param {boolean} options.lowPriority - Use requestIdleCallback (default: false)
 */
export const preloadImages = async (urls, options = {}) => {
  const { concurrency = 4, lowPriority = false } = options
  
  if (!urls || urls.length === 0) return []
  
  // Filter out already cached/loading images
  const toLoad = urls.filter(url => url && !imageCache.has(url) && !loadingImages.has(url))
  
  if (toLoad.length === 0) return []
  
  const results = []
  
  // Process in batches for controlled concurrency
  for (let i = 0; i < toLoad.length; i += concurrency) {
    const batch = toLoad.slice(i, i + concurrency)
    
    if (lowPriority && 'requestIdleCallback' in window) {
      // Low priority: wait for idle time
      await new Promise(resolve => {
        window.requestIdleCallback(() => resolve(), { timeout: 2000 })
      })
    }
    
    const batchResults = await Promise.all(batch.map(preloadImage))
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Check if an image is cached
 * @param {string} src - Image URL
 * @returns {boolean}
 */
export const isImageCached = (src) => imageCache.has(src)

/**
 * Get cache statistics
 */
export const getCacheStats = () => ({
  cached: imageCache.size,
  loading: loadingImages.size,
})

/**
 * Hook to preload images for timeline events
 * @param {Array} events - Timeline events with image URLs
 * @param {Object} options - Preloader options
 */
export const useImagePreloader = (events, options = {}) => {
  const preloadedRef = useRef(new Set())
  
  useEffect(() => {
    if (!events || events.length === 0) return
    
    // Collect all image URLs from events
    const imageUrls = []
    
    events.forEach(event => {
      // Main image
      if (event.main_image || event.image_url || event.mainImage) {
        const url = event.main_image || event.image_url || event.mainImage
        if (!preloadedRef.current.has(url)) {
          imageUrls.push(url)
        }
      }
      
      // Puzzle image
      if (event.puzzle_image_url || event.puzzleImage) {
        const url = event.puzzle_image_url || event.puzzleImage
        if (!preloadedRef.current.has(url)) {
          imageUrls.push(url)
        }
      }
      
      // Thumbnail
      if (event.thumbnail_url || event.thumbnail) {
        const url = event.thumbnail_url || event.thumbnail
        if (!preloadedRef.current.has(url)) {
          imageUrls.push(url)
        }
      }
    })
    
    // Mark as queued
    imageUrls.forEach(url => preloadedRef.current.add(url))
    
    // Preload with low priority to not block main thread
    if (imageUrls.length > 0) {
      preloadImages(imageUrls, { 
        lowPriority: true, 
        concurrency: 3,
        ...options 
      })
    }
  }, [events, options])
  
  // Return helper to manually preload specific images
  const preload = useCallback((urls) => {
    if (Array.isArray(urls)) {
      preloadImages(urls, { concurrency: 4 })
    } else if (urls) {
      preloadImage(urls)
    }
  }, [])
  
  return { preload, isImageCached, getCacheStats }
}

/**
 * Hook to preload images when element is near viewport
 * Uses Intersection Observer for lazy preloading
 */
export const useVisibilityPreloader = (imageUrls, options = {}) => {
  const containerRef = useRef(null)
  const preloadedRef = useRef(false)
  
  useEffect(() => {
    if (!containerRef.current || preloadedRef.current || !imageUrls?.length) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !preloadedRef.current) {
            preloadedRef.current = true
            preloadImages(imageUrls, { concurrency: 2 })
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px', ...options }
    )
    
    observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [imageUrls, options])
  
  return containerRef
}

export default useImagePreloader
