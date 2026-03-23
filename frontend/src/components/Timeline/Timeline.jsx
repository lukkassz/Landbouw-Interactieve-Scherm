import React, { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import IdleScreen from "./content/IdleScreen"
import ActiveEventSlide from "./content/ActiveEventSlide"
import TimelineScrubber from "./ui/TimelineScrubber"
import LoadingSkeleton from "./ui/LoadingSkeleton"
import { getTheme } from "../../config/themes"
import { useTimeline } from "../../hooks/useTimeline"
import { useSound } from "../../hooks/useSound"
import { useIdleTimer } from "../../hooks/useIdleTimer"
import { useImagePreloader } from "../../hooks/useImagePreloader"
import { extractYear as extractYearUtil } from "../../utils/timelineCalculations"

// Farm Background (Neutral)
const BACKGROUND_IMAGE_URL = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"

const Timeline = () => {
  const theme = getTheme()
  const { timelineData: apiData, loading, error } = useTimeline()
  const { playSound } = useSound()
  
  const [isIdle, setIsIdle] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // Handle idle timeout (5 minutes)
  const handleIdle = useRef(() => {
    setIsIdle(true)
    setShowLoadingAnimation(false)
    setActiveIndex(0) // Reset to first event
  })

  // Idle timer
  useIdleTimer(300000, handleIdle.current, !isIdle)

  // Handle activation from idle screen
  const handleActivate = () => {
    if (isIdle) {
      playSound()
      setIsIdle(false)
      setShowLoadingAnimation(true)
      setTimeout(() => {
        setShowLoadingAnimation(false)
      }, 1500)
    }
  }

  // Preload UI sounds and images
  useImagePreloader(apiData)

  // Map API data to component format
  const timelineData = useMemo(() => {
    if (!apiData || apiData.length === 0) return []
    return apiData.map(event => ({
      id: event.id?.toString() || `event-${event.id}`,
      year: event.year || "",
      title: event.title || "",
      subtitle: event.subtitle || "", // If available
      description: event.description || "",
      mainImage: event.main_image || event.image_url || null,
      category: (event.category || "museum").toLowerCase(),
      gameType: event.game_type || "none",
    }))
  }, [apiData])

  // Get specific min/max bounds for scrubber
  const { minYear, maxYear } = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return { minYear: 1850, maxYear: 2025 }
    const years = timelineData.map(e => extractYearUtil(e.year)).filter(Boolean)
    if (years.length === 0) return { minYear: 1850, maxYear: 2025 }
    return {
      minYear: Math.floor(Math.min(...years) / 50) * 50, // e.g. 1850
      maxYear: Math.ceil(Math.max(...years) / 50) * 50 // e.g. 2050
    }
  }, [timelineData])

  // Top header with logo and menu
  const TopHeader = () => (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-10 md:p-14 pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-white font-serif italic text-3xl tracking-tight drop-shadow-lg" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          AgriTimeline
        </h2>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-auto cursor-pointer"
      >
        {/* Hamburger Menu Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </motion.div>
    </div>
  )

  // -- Render States -- //

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-zinc-900 pt-32">
        <div className="absolute inset-0 w-full h-full">
          <img src={BACKGROUND_IMAGE_URL} alt="Loading" className="w-full h-full object-cover blur-sm opacity-50" />
        </div>
        <TopHeader />
        <div className="relative z-10 flex items-center justify-center h-full pt-32">
          <LoadingSkeleton count={3} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center text-red-500 bg-black/40 p-8 rounded-xl backdrop-blur-md">
          <div className="text-xl font-bold mb-2">Error loading data</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="text-center bg-black/40 p-12 rounded-xl backdrop-blur-md">
          <div className="text-3xl font-bold mb-4">No timeline data available</div>
          <div className="text-gray-400">Check that events are marked as active in the admin panel.</div>
        </div>
      </div>
    )
  }

  if (isIdle) {
    return (
      <AnimatePresence mode="wait">
        <IdleScreen key="idle" onActivate={handleActivate} />
      </AnimatePresence>
    )
  }

  if (showLoadingAnimation) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 w-full h-full">
          <img src={BACKGROUND_IMAGE_URL} alt="Transition" className="w-full h-full object-cover opacity-30" />
        </div>
        <TopHeader />
        <div className="relative z-10 flex items-center justify-center h-full w-full absolute inset-0">
          <div className="w-16 h-16 border-4 border-[#e0b85a]/30 border-t-[#e0b85a] rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const activeEvent = timelineData[activeIndex]

  return (
    <div className="min-h-screen relative overflow-hidden bg-black select-none" style={{ touchAction: "none" }}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full transition-opacity duration-1000">
        <img
          src={activeEvent?.mainImage || BACKGROUND_IMAGE_URL}
          alt="Timeline Background"
          className="w-full h-full object-cover"
        />
      </div>

      <TopHeader />

      {/* Main Slide Content */}
      <ActiveEventSlide 
        event={activeEvent} 
        isActive={true} 
      />

      {/* Bottom Scrubber */}
      <TimelineScrubber 
        events={timelineData} 
        activeIndex={activeIndex} 
        onSelectEvent={(index) => {
          playSound()
          setActiveIndex(index)
        }} 
        minYear={1850}
        maxYear={2050}
      />
    </div>
  )
}

export default Timeline
