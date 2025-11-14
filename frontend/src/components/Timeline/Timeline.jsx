import React, { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TimelineModal from "./modals/TimelineModal"
import TimelineDetailModal from "./modals/TimelineDetailModal"
import MuseumHeadline from "./content/MuseumHeadline"
import VirtualGuide from "./content/VirtualGuide"
import StudentenwerkLogo from "../Common/StudentenwerkLogo"
import IdleScreen from "./content/IdleScreen"
import AnimatedAnimals from "./content/AnimatedAnimals"
import { getTheme } from "../../config/themes"
import { useTimeline } from "../../hooks/useTimeline"
import { useSound } from "../../hooks/useSound"
import { useIdleTimer } from "../../hooks/useIdleTimer"
import LoadingSkeleton from "./ui/LoadingSkeleton"
import AnimatedYear from "./ui/AnimatedYear"
import {
  generateYearMarkers,
  groupEventsByMarkers,
  calculateEventPosition,
  extractYear as extractYearUtil,
} from "../../utils/timelineCalculations"

// Import puzzle images
import puzzleImg from "../../assets/images/puzzle/brown_cow_kids.jpg"
// Import background video
import backgroundTimelineVideo from "../../assets/video/5197931-uhd_3840_2160_30fps.mp4"

// Helper function to get border color based on category
const getCategoryBorderColor = category => {
  const categoryColors = {
    museum: "#a35514",
    landbouw: "#22c55e", // green-500
    maatschappelijk: "#c9a300",
  }
  return categoryColors[category] || categoryColors.museum // Default to museum color
}

// Hardcoded gradient map for each event year (single years only)
const GRADIENT_MAP = {
  1925: {
    gradient: "from-amber-600 to-orange-500",
    museumGradient: "from-brand-rust to-brand-terracotta",
  },
  1930: {
    gradient: "from-blue-600 to-cyan-500",
    museumGradient: "from-brand-sky to-brand-mist",
  },
  1945: {
    gradient: "from-slate-600 to-gray-500",
    museumGradient: "from-brand-slate to-brand-maroon",
  },
  1987: {
    gradient: "from-green-600 to-emerald-500",
    museumGradient: "from-brand-olive to-brand-mist",
  },
  2006: {
    gradient: "from-indigo-600 to-purple-500",
    museumGradient: "from-brand-amber to-brand-terracotta",
  },
  2018: {
    gradient: "from-rose-600 to-pink-500",
    museumGradient: "from-brand-rust to-brand-gold",
  },
  2020: {
    gradient: "from-teal-600 to-cyan-500",
    museumGradient: "from-brand-mist to-brand-sky",
  },
  2023: {
    gradient: "from-yellow-500 to-amber-600",
    museumGradient: "from-brand-gold to-brand-amber",
  },
  2026: {
    gradient: "from-violet-600 to-fuchsia-500",
    museumGradient: "from-brand-amber to-brand-rust",
  },
}

// Available gradient palettes for new events (rotated based on year)
const GRADIENT_PALETTE = [
  {
    gradient: "from-amber-600 to-orange-500",
    museumGradient: "from-brand-rust to-brand-terracotta",
  },
  {
    gradient: "from-blue-600 to-cyan-500",
    museumGradient: "from-brand-sky to-brand-mist",
  },
  {
    gradient: "from-slate-600 to-gray-500",
    museumGradient: "from-brand-slate to-brand-maroon",
  },
  {
    gradient: "from-green-600 to-emerald-500",
    museumGradient: "from-brand-olive to-brand-mist",
  },
  {
    gradient: "from-indigo-600 to-purple-500",
    museumGradient: "from-brand-amber to-brand-terracotta",
  },
  {
    gradient: "from-rose-600 to-pink-500",
    museumGradient: "from-brand-rust to-brand-gold",
  },
  {
    gradient: "from-teal-600 to-cyan-500",
    museumGradient: "from-brand-mist to-brand-sky",
  },
  {
    gradient: "from-yellow-500 to-amber-600",
    museumGradient: "from-brand-gold to-brand-amber",
  },
  {
    gradient: "from-violet-600 to-fuchsia-500",
    museumGradient: "from-brand-amber to-brand-rust",
  },
]

// Helper function to extract numeric year from year string (e.g. "1925", "1930-1956" -> 1925, 1930)
const extractYear = yearString => {
  if (!yearString) return null
  const match = yearString.match(/\d{4}/)
  return match ? parseInt(match[0], 10) : null
}

// Helper function to get gradient for an event
const getGradientForEvent = event => {
  // Extract numeric year from year string (handles both "1925" and legacy "1930-1956" formats)
  const yearString = event.year || ""
  const numericYear = extractYear(yearString)
  const gradientData = numericYear ? GRADIENT_MAP[numericYear] : null

  // If year is in hardcoded map, use it (or database value if exists)
  if (gradientData) {
    return {
      gradient: event.gradient || gradientData.gradient,
      museumGradient: event.museum_gradient || gradientData.museumGradient,
    }
  }

  // If gradient exists in database, use it
  if (event.gradient || event.museum_gradient) {
    return {
      gradient: event.gradient || "from-gray-600 to-gray-500",
      museumGradient:
        event.museum_gradient || "from-brand-rust to-brand-terracotta",
    }
  }

  // For new events: assign gradient based on year (rotates through palette)
  if (numericYear) {
    // Use modulo to cycle through available gradients
    const paletteIndex = (numericYear - 1900) % GRADIENT_PALETTE.length
    const selectedPalette = GRADIENT_PALETTE[paletteIndex]
    return {
      gradient: selectedPalette.gradient,
      museumGradient: selectedPalette.museumGradient,
    }
  }

  // Final fallback
  return {
    gradient: "from-gray-600 to-gray-500",
    museumGradient: "from-brand-rust to-brand-terracotta",
  }
}

const Timeline = () => {
  const theme = getTheme()
  const { timelineData: apiData, loading, error } = useTimeline()
  const playSound = useSound()
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const timelineRef = useRef(null)
  const videoRef = useRef(null)

  // Idle screen state - start in idle mode
  const [isIdle, setIsIdle] = useState(true)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)

  // Handle idle timeout (5 minutes)
  const handleIdle = useRef(() => {
    setIsIdle(true)
    setShowLoadingAnimation(false)
    // Reset timeline state when returning to idle
    setSelectedPeriod(null)
    setIsModalOpen(false)
    setIsDetailModalOpen(false)
    setSelectedTimelineItem(null)
  })

  // Idle timer - only active when not in idle mode
  // Timer automatically resets on user interactions (click, touch, scroll, mousemove, keypress)
  useIdleTimer(300000, handleIdle.current, !isIdle)

  // Handle activation from idle screen
  const handleActivate = () => {
    if (isIdle) {
      setIsIdle(false)
      setShowLoadingAnimation(true)
      // Show loading animation for 2 seconds, then show timeline
      setTimeout(() => {
        setShowLoadingAnimation(false)
      }, 2000)
    }
  }

  // Handle video loop
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.addEventListener("ended", () => {
        video.currentTime = 0
        video.play()
      })
    }
  }, [])

  // Map API data to component format
  const timelineData = useMemo(() => {
    if (!apiData || apiData.length === 0) return []

    return apiData.map(event => {
      // Get hardcoded gradients based on year
      const gradients = getGradientForEvent(event)

      return {
        id: event.id?.toString() || `event-${event.id}`,
        year: event.year || "",
        title: event.title || "",
        description: event.description || "",
        gradient: gradients.gradient,
        museumGradient: gradients.museumGradient,
        stage: event.stage || 1,
        hasPuzzle:
          event.has_puzzle === true ||
          event.has_puzzle === 1 ||
          event.has_puzzle === "1" ||
          Boolean(event.has_puzzle),
        puzzleImage:
          event.puzzle_image_url &&
          event.puzzle_image_url.trim() !== ""
            ? event.puzzle_image_url
            : null,
        icon: event.icon || "🌾",
        useDetailedModal: true, // Always use detailed modal
        historicalContext: event.historical_context || "",
        has_key_moments:
          event.has_key_moments === true ||
          event.has_key_moments === 1 ||
          event.has_key_moments === "1" ||
          Boolean(event.has_key_moments),
        category: event.category || "museum", // Default to museum if not set
      }
    })
  }, [apiData])

  // Generate year markers (1925, 1930, 1935... 2025)
  const yearMarkers = useMemo(() => {
    return generateYearMarkers(1925, 2025, 5)
  }, [])

  // Group events by year markers
  const timelineSections = useMemo(() => {
    return groupEventsByMarkers(timelineData, yearMarkers)
  }, [timelineData, yearMarkers])

  const handleMouseDown = e => {
    // Only handle left mouse button
    if (e.button !== 0 && e.type === "mousedown") return
    setIsDragging(true)
    setStartX(e.pageX || (e.touches && e.touches[0]?.pageX) || 0)
    if (timelineRef.current) {
      setScrollLeft(timelineRef.current.scrollLeft)
    }
  }

  const handleMouseMove = e => {
    if (!isDragging || !timelineRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const x = e.pageX || (e.touches && e.touches[0]?.pageX) || 0
    const walk = (x - startX) * 2
    const newScrollLeft = scrollLeft - walk
    timelineRef.current.scrollLeft = newScrollLeft
  }

  const handleMouseUp = e => {
    // Only handle left mouse button
    if (e.button !== 0 && e.type === "mouseup") return
    setIsDragging(false)
  }

  const handleCardClick = periodId => {
    if (!isDragging) {
      playSound()
      const timelineItem = timelineData.find(item => item.id === periodId)
      setSelectedTimelineItem(timelineItem)

      // Always use detailed modal
      setIsDetailModalOpen(true)
      console.log("Navigeer naar periode:", periodId)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTimelineItem(null)
    setSelectedPeriod(null)
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedTimelineItem(null)
  }

  const openPuzzleModal = () => {
    setIsLegacyModalOpen(true)
  }

  const closePuzzleModal = () => {
    setIsLegacyModalOpen(false)
  }

  // Show loading state with skeleton
  if (loading) {
    return (
      <div
        className="min-h-screen relative overflow-hidden pt-32"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          overscrollBehaviorX: "none",
          touchAction: "pan-x pan-y",
          WebkitOverflowScrolling: "touch",
        }}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundTimelineVideo} type="video/mp4" />
        </video>

        {/* Theme-based overlay - reduced opacity for less orange tint */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.background.primary}`}
        />

        {/* Subtle pattern overlay - reduced opacity */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${theme.background.overlay}`}
        />

        {/* Studentenwerk Logo */}
        <StudentenwerkLogo />

        {/* Headline */}
        <div className="relative z-10">
          <MuseumHeadline
            text="100 jaar geschiedenis"
            subtext="Fries Landbouwmuseum"
          />
        </div>

        {/* Loading Skeletons */}
        <div className="timeline-container py-8 md:py-16 relative w-full h-full z-10">
          <div className="relative pb-32 overflow-hidden">
            <motion.div
              className="overflow-x-auto scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Timeline Line */}
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r ${theme.timeline.line} w-full min-w-max shadow-lg rounded-full`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${theme.timeline.line} blur-sm opacity-70 rounded-full`}
                />
              </div>

              {/* Loading Skeletons */}
              <LoadingSkeleton count={9} />
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          overscrollBehaviorX: "none",
          touchAction: "pan-x pan-y",
        }}
      >
        <div className="text-center text-red-500">
          <div className="text-xl">Fout bij het laden van data: {error}</div>
        </div>
      </div>
    )
  }

  // Fallback to empty array if no data
  if (!timelineData || timelineData.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          overscrollBehaviorX: "none",
          touchAction: "pan-x pan-y",
        }}
      >
        <div className="text-center p-8">
          <div className="text-2xl font-bold mb-4">
            Geen timeline data beschikbaar
          </div>
          <div className="text-lg mb-2">
            {error ? (
              <div className="text-red-500">
                <p className="mb-2">Fout bij het ophalen van data:</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <div>
                <p className="mb-2">Geen actieve events gevonden.</p>
                <p className="text-sm text-gray-400">
                  Controleer of events zijn gemarkeerd als actief in het admin
                  panel.
                </p>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-4">
            API URL:{" "}
            {import.meta.env.VITE_API_URL || "http://localhost/backend/api"}
          </div>
        </div>
      </div>
    )
  }

  // Show idle screen
  if (isIdle) {
    return (
      <AnimatePresence mode="wait">
        <IdleScreen key="idle" onActivate={handleActivate} />
      </AnimatePresence>
    )
  }

  // Show loading animation when transitioning from idle
  if (showLoadingAnimation) {
    return (
      <div
        className="min-h-screen relative overflow-hidden pt-32"
        style={{
          overscrollBehavior: "none",
          overscrollBehaviorY: "none",
          overscrollBehaviorX: "none",
          touchAction: "pan-x pan-y",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Background video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={backgroundTimelineVideo} type="video/mp4" />
        </video>

        {/* Theme-based overlay - reduced opacity for less orange tint */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${theme.background.primary}`}
        />

        {/* Subtle pattern overlay - reduced opacity */}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${theme.background.overlay}`}
        />

        {/* Studentenwerk Logo */}
        <StudentenwerkLogo />

        {/* Headline */}
        <div className="relative z-10">
          <MuseumHeadline
            text="100 jaar geschiedenis"
            subtext="Fries Landbouwmuseum"
          />
        </div>

        {/* Loading Animation */}
        <div className="timeline-container py-8 md:py-16 relative w-full h-full z-10">
          <div className="relative pb-32 overflow-hidden">
            <motion.div
              className="overflow-x-auto scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Timeline Line */}
              <div
                className={`absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r ${theme.timeline.line} w-full min-w-max shadow-lg rounded-full`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${theme.timeline.line} blur-sm opacity-70 rounded-full`}
                />
              </div>

              {/* Loading Skeletons */}
              <LoadingSkeleton count={9} />
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden pt-32"
      style={{
        overscrollBehavior: "none",
        overscrollBehaviorY: "none",
        overscrollBehaviorX: "none",
        touchAction: "pan-x pan-y",
        WebkitOverflowScrolling: "touch",
      }}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={backgroundTimelineVideo} type="video/mp4" />
      </video>

      {/* Theme-based overlay - reduced opacity for less orange tint */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.background.primary}`}
      />

      {/* Subtle pattern overlay - reduced opacity */}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${theme.background.overlay}`}
      />

      {/* Studentenwerk Logo */}
      <StudentenwerkLogo />

      {/* Virtual Guide Mascot */}
      <VirtualGuide
        messages={[
          "Tik op een tijdperk om meer te weten te komen!",
          "Veeg naar links of rechts om door de geschiedenis te bladeren!",
          "Ontdek 100 jaar Fries Landbouwmuseum!",
        ]}
        position="top-right"
      />

      {/* Headline */}
      <div className="relative z-10">
        <MuseumHeadline
          text="100 jaar geschiedenis"
          subtext="Fries Landbouwmuseum"
        />
      </div>

      {/* Animated Animals - only on active timeline, not on idle screen */}
      <AnimatedAnimals />

      <div className="timeline-container py-8 md:py-16 relative w-full h-full z-10">
        {/* Timeline Container - no header, no indicators */}
        <div className="relative pb-32 overflow-hidden">
          <motion.div
            ref={timelineRef}
            className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollBehavior: isDragging ? "auto" : "smooth",
              userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragStart={e => e.preventDefault()}
          >
            {/* Horizontal Timeline with Year Markers and Event Sections */}
            <motion.div
              className="flex flex-row items-start gap-0 min-w-max px-16 md:px-32 pt-16 md:pt-24 pb-16 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Timeline Line - Continuous Horizontal Line */}
              <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 z-0 pointer-events-none">
                <div
                  className={`h-3 bg-gradient-to-r ${theme.timeline.line} shadow-2xl rounded-full w-full`}
                  style={{
                    boxShadow: "0 0 20px rgba(201, 163, 0, 0.3), 0 4px 12px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${theme.timeline.line} blur-md opacity-70 rounded-full`}
                  ></div>
                </div>
              </div>
              {timelineSections.map((section, sectionIndex) => (
                <div
                  key={section.markerYear}
                  className="flex flex-col items-start min-w-[500px] md:min-w-[600px] flex-shrink-0 relative pr-16 md:pr-24"
                >
                  {/* Year Marker - Large, Yellow, No Background */}
                  <div className="sticky left-0 top-0 z-20 mb-12">
                    <motion.span
                      className="text-7xl md:text-8xl font-bold block whitespace-nowrap pointer-events-none"
                      style={{
                        color: "#c9a300",
                        opacity: 0.5,
                        textShadow: "0 2px 8px rgba(201, 163, 0, 0.2)",
                        letterSpacing: "-0.02em",
                      }}
                      initial={{ opacity: 0, y: -30 }}
                      animate={{ opacity: 0.5, y: 0 }}
                      transition={{
                        duration: 0.8,
                        delay: sectionIndex * 0.1,
                        ease: "easeOut",
                      }}
                    >
                      {section.markerYear}
                    </motion.span>
                  </div>

                  {/* Events in this section */}
                  <div className="flex flex-row flex-wrap gap-8 md:gap-12 w-full py-5 relative z-10">
                    {section.events.length > 0 ? (
                      section.events.map((period, eventIndex) => (
                        <motion.div
                          key={period.id}
                          className="relative flex-shrink-0"
                          initial={{ opacity: 0, y: 100, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            duration: 0.8,
                            delay: sectionIndex * 0.15 + eventIndex * 0.1,
                            ease: "easeOut",
                          }}
                        >
                          <div className={`${eventIndex % 2 === 0 ? "mb-48" : "mt-48"} relative`}>
                            {/* Event Year Label */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
                              <span
                                className="text-4xl font-light whitespace-nowrap pointer-events-none"
                                style={{
                                  color: "#c9a300",
                                  opacity: 0.7,
                                  textShadow: "0 2px 6px rgba(201, 163, 0, 0.2)",
                                }}
                              >
                                {extractYearUtil(period.year)}
                              </span>
                            </div>

                            <motion.div
                              className="cursor-pointer w-[280px] min-w-[280px] max-w-[280px]"
                              onClick={() => handleCardClick(period.id)}
                              whileTap={{ scale: 0.98 }}
                            >
                            {/* Event Card */}
                            <motion.div
                              className={`relative ${theme.timeline.cardBg} p-8 rounded-3xl border overflow-hidden shadow-xl`}
                              style={{
                                filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                                borderColor: getCategoryBorderColor(period.category),
                                borderWidth: "5px",
                              }}
                              animate={{
                                filter:
                                  selectedPeriod === period.id
                                    ? "drop-shadow(0 6px 20px rgba(201,163,0,0.3))"
                                    : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                              }}
                              transition={{ duration: 0.3 }}
                              whileHover={{
                                y: -4,
                                filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.12))",
                              }}
                            >
                              <div className="relative flex justify-center mb-6">
                                <motion.div
                                  className="w-20 h-20 flex items-center justify-center text-4xl rounded-2xl shadow-lg"
                                  style={{
                                    backgroundColor:
                                      theme.name === "museum"
                                        ? "#a7b8b4"
                                        : "rgba(255, 255, 255, 0.2)",
                                    borderColor:
                                      theme.name === "museum"
                                        ? "#a7b8b4"
                                        : "rgba(255, 255, 255, 0.3)",
                                    borderWidth:
                                      theme.name === "museum" ? "2px" : "1px",
                                    color:
                                      theme.name === "museum" ? "#ae5514" : undefined,
                                  }}
                                  whileHover={{
                                    rotate: [0, -10, 10, -10, 0],
                                    scale: 1.1,
                                  }}
                                  transition={{ duration: 0.5 }}
                                >
                                  {period.icon || "🌾"}
                                </motion.div>
                              </div>

                              <div className="text-center mb-4 relative">
                                <h3
                                  className="text-2xl font-bold leading-tight"
                                  style={{
                                    color: "#440f0f",
                                  }}
                                >
                                  {period.title}
                                </h3>
                              </div>

                              <div className="text-center relative">
                                <p
                                  className="leading-relaxed"
                                  style={{
                                    color: "#657575",
                                  }}
                                >
                                  {period.description}
                                </p>
                              </div>
                            </motion.div>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      // Empty section - minimal space placeholder
                      <div className="w-24 h-48 opacity-0" />
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
            
            {/* Fallback: If no sections, show events normally */}
            {timelineSections.length === 0 && (
              <motion.div
                className="flex items-center space-x-16 md:space-x-32 min-w-max px-16 md:px-32 pt-16 md:pt-24 pb-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                {timelineData.map((period, index) => (
                <motion.div
                  key={period.id}
                  className="relative flex-shrink-0 z-10"
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.2,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className={`${index % 2 === 0 ? "mb-48" : "mt-48"} w-80`}
                  >
                    <motion.div
                      className="cursor-pointer"
                      onClick={() => handleCardClick(period.id)}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Year - Animated */}
                      <div className="text-center mb-6">
                        <AnimatedYear
                          year={period.year}
                          theme={theme}
                          gradient={period.gradient}
                        />
                      </div>

                      {/* Kaart */}
                      <motion.div
                        className={`relative ${theme.timeline.cardBg} p-8 rounded-3xl border overflow-hidden mb-8 shadow-xl`}
                        style={{
                          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                          borderColor: getCategoryBorderColor(period.category),
                          borderWidth: "3px",
                        }}
                        animate={{
                          filter:
                            selectedPeriod === period.id
                              ? "drop-shadow(0 6px 20px rgba(201,163,0,0.3))"
                              : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="relative flex justify-center mb-6">
                          <motion.div
                            className="w-20 h-20 flex items-center justify-center text-4xl rounded-2xl shadow-lg"
                            style={{
                              backgroundColor:
                                theme.name === "museum"
                                  ? "#a7b8b4"
                                  : "rgba(255, 255, 255, 0.2)",
                              borderColor:
                                theme.name === "museum"
                                  ? "#a7b8b4"
                                  : "rgba(255, 255, 255, 0.3)",
                              borderWidth:
                                theme.name === "museum" ? "2px" : "1px",
                              color:
                                theme.name === "museum" ? "#ae5514" : undefined,
                            }}
                            whileHover={{
                              rotate: [0, -10, 10, -10, 0],
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            {period.icon || "🌾"}
                          </motion.div>
                        </div>

                        <div className="text-center mb-4 relative">
                          <h3
                            className="text-2xl font-bold leading-tight"
                            style={{
                              color: "#440f0f",
                            }}
                          >
                            {period.title}
                          </h3>
                        </div>

                        <div className="text-center relative">
                          <p
                            className="leading-relaxed"
                            style={{
                              color: "#657575",
                            }}
                          >
                            {period.description}
                          </p>
                        </div>

                        {/* Removed selected checkmark/highlight */}
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Sliding detail panel disabled per request */}

      {/* New detailed modal for enhanced timeline events */}
      <AnimatePresence>
        {isDetailModalOpen && (
          <TimelineDetailModal
            isOpen={isDetailModalOpen}
            onClose={closeDetailModal}
            eventData={selectedTimelineItem}
          />
        )}
      </AnimatePresence>

      {/* Original timeline modal for puzzle and legacy interactions */}
      <AnimatePresence>
        {isLegacyModalOpen && (
          <TimelineModal
            isOpen={isLegacyModalOpen}
            onClose={closePuzzleModal}
            timelineItem={selectedTimelineItem}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Timeline
