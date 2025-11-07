import React, { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TimelineModal from "./modals/TimelineModal"
import TimelineDetailModal from "./modals/TimelineDetailModal"
import MuseumHeadline from "./content/MuseumHeadline"
import VirtualGuide from "./content/VirtualGuide"
import ThemeSwitcher from "../Common/ThemeSwitcher"
import StudentenwerkLogo from "../Common/StudentenwerkLogo"
import { getTheme } from "../../config/themes"
import { useTimeline } from "../../hooks/useTimeline"
import { useSound } from "../../hooks/useSound"
import LoadingSkeleton from "./ui/LoadingSkeleton"
import AnimatedYear from "./ui/AnimatedYear"

// Import puzzle images
import puzzleImg from "../../assets/images/puzzle/brown_cow_kids.jpg"
// Import background video
import backgroundTimelineVideo from "../../assets/video/5197931-uhd_3840_2160_30fps.mp4"

// Hardcoded gradient map for each event year
const GRADIENT_MAP = {
  1925: {
    gradient: "from-amber-600 to-orange-500",
    museumGradient: "from-brand-rust to-brand-terracotta",
  },
  "1930-1956": {
    gradient: "from-blue-600 to-cyan-500",
    museumGradient: "from-brand-sky to-brand-mist",
  },
  "1945-1987": {
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
  "2023-2025": {
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
  const year = event.year || ""
  const gradientData = GRADIENT_MAP[year]

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
  const numericYear = extractYear(year)
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
        hasPuzzle: event.has_puzzle || false,
        puzzleImage: event.puzzle_image_url
          ? event.puzzle_image_url
          : puzzleImg,
        icon: event.icon || "🌾",
        useDetailedModal:
          event.use_detailed_modal === true || event.use_detailed_modal === 1,
        historicalContext: event.historical_context || "",
      }
    })
  }, [apiData])

  const handleMouseDown = e => {
    setIsDragging(true)
    setStartX(e.pageX || e.touches[0].pageX)
    setScrollLeft(timelineRef.current.scrollLeft)
  }

  const handleMouseMove = e => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX || e.touches[0].pageX
    const walk = (x - startX) * 2
    const newScrollLeft = scrollLeft - walk
    timelineRef.current.scrollLeft = newScrollLeft
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCardClick = periodId => {
    if (!isDragging) {
      playSound()
      const timelineItem = timelineData.find(item => item.id === periodId)
      setSelectedTimelineItem(timelineItem)

      // Use detailed modal for items with enhanced data, otherwise use legacy modal
      if (timelineItem?.useDetailedModal) {
        setIsDetailModalOpen(true)
      } else {
        setIsLegacyModalOpen(true)
      }
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

        {/* Theme Switcher */}
        <ThemeSwitcher />

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <div className="text-xl">Fout bij het laden van data: {error}</div>
        </div>
      </div>
    )
  }

  // Fallback to empty array if no data
  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  return (
    <div
      className="min-h-screen relative overflow-hidden pt-32"
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

      {/* Theme Switcher */}
      <ThemeSwitcher />

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

      <div className="timeline-container py-8 md:py-16 relative w-full h-full z-10">
        {/* Timeline Container - geen header, geen indicatoren */}
        <div
          ref={timelineRef}
          className="relative pb-32 cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            scrollBehavior: isDragging ? "auto" : "smooth",
            userSelect: "none",
          }}
        >
          <motion.div
            className="overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* Timeline Lijn */}
            <div
              className={`absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r ${theme.timeline.line} w-full min-w-max shadow-lg rounded-full`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${theme.timeline.line} blur-sm opacity-70 rounded-full`}
              ></div>
            </div>

            {/* Timeline Items */}
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
                      {/* Jaar - Animated */}
                      <div className="text-center mb-6">
                        <AnimatedYear
                          year={period.year}
                          theme={theme}
                          gradient={period.gradient}
                        />
                      </div>

                      {/* Kaart */}
                      <motion.div
                        className={`relative ${
                          theme.timeline.cardBg
                        } p-8 rounded-3xl border ${
                          theme.timeline.cardBorder
                        } overflow-hidden mb-8 shadow-xl ${
                          theme.name === "modern" ? "backdrop-blur-lg" : ""
                        }`}
                        style={{
                          filter:
                            theme.name === "modern"
                              ? "drop-shadow(0 20px 40px rgba(0,0,0,0.4))"
                              : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                        }}
                        animate={{
                          filter:
                            selectedPeriod === period.id
                              ? theme.name === "modern"
                                ? "drop-shadow(0 25px 50px rgba(244, 63, 94, 0.4))"
                                : "drop-shadow(0 6px 20px rgba(201,163,0,0.3))"
                              : theme.name === "modern"
                              ? "drop-shadow(0 15px 35px rgba(0,0,0,0.3))"
                              : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Gradient overlay - only in modern theme */}
                        {theme.name === "modern" && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${period.gradient} opacity-20`}
                          />
                        )}

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
                            className={`text-2xl font-bold leading-tight ${
                              theme.name === "modern"
                                ? `bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent`
                                : ""
                            }`}
                            style={{
                              color:
                                theme.name === "museum" ? "#440f0f" : undefined,
                            }}
                          >
                            {period.title}
                          </h3>
                        </div>

                        <div className="text-center relative">
                          <p
                            className="leading-relaxed"
                            style={{
                              color:
                                theme.name === "museum"
                                  ? "#657575"
                                  : theme.name === "modern"
                                  ? "#e5e7eb"
                                  : undefined,
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
