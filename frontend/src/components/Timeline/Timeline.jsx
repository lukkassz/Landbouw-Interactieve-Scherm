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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
      subtitle: event.subtitle || "",
      description: event.description || "",
      scrubber_label: event.scrubber_label || "",
      infobox_title: event.infobox_title || "",
      infobox_subtitle: event.infobox_subtitle || "",
      icon_name: event.icon_name || "none",
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
        className="pointer-events-auto cursor-pointer w-12 h-12 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors border border-white/10"
        onClick={() => setIsMenuOpen(true)}
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
    // Show the currently selected event (or the first one on fresh load) as
    // the "Current Display" on the idle screen. activeIndex is reset to 0 on
    // idle timeout, so this matches what the user will see after tapping
    // "Begin Your Journey".
    const featuredEvent = timelineData[activeIndex] ?? timelineData[0] ?? null
    return (
      <AnimatePresence mode="wait">
        <IdleScreen
          key="idle"
          onActivate={handleActivate}
          featuredEvent={featuredEvent}
        />
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
        minYear={minYear}
        maxYear={maxYear}
      />

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-[100] flex justify-end pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.div 
              className="relative w-full max-w-sm h-full bg-[#111] shadow-2xl flex flex-col pt-16 px-10 border-l border-white/10"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-10 right-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <h2 className="text-2xl font-serif italic text-[#e0b85a] mb-12 border-b border-white/10 pb-6">Menu</h2>
              
              <nav className="flex flex-col gap-6">
                {[
                  { label: "Home", icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> },
                  { label: "Games & Puzzles", icon: <rect x="2" y="6" width="20" height="12" rx="2"></rect> },
                  { label: "Multimedia", icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> },
                  { label: "Search", icon: <circle cx="11" cy="11" r="8"></circle> },
                  { label: "Change Language", icon: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path> }
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-4 text-white/70 hover:text-white cursor-pointer group transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#e0b85a]/20 group-hover:text-[#e0b85a] transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {item.icon}
                      </svg>
                    </div>
                    <span className="font-sans font-medium text-lg tracking-wide">{item.label}</span>
                  </div>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Timeline
