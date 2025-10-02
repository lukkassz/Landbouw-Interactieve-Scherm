import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TimelineModal from "./TimelineModal"

// Import puzzle images
import puzzleImg from "../../assets/images/puzzle/brown_cow_kids.jpg"
// Import background image
import backgroundTimelineImg from "../../assets/images/timeline/achtergrond3.png"

const Timeline = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  const [lastActivityTime, setLastActivityTime] = useState(Date.now())
  const [logoKey, setLogoKey] = useState(0)
  const timelineRef = useRef(null)
  const inactivityTimerRef = useRef(null)

  // Preload background image for faster loading
  useEffect(() => {
    const img = new Image()
    img.src = backgroundTimelineImg
  }, [])

  // Inactivity detection system for museum display
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityTime

      // Show hint continuously after 8 seconds of inactivity
      if (timeSinceActivity > 8000) {
        setShowSwipeHint(true)
      } else {
        setShowSwipeHint(false)
      }
    }

    // Check every 1 second for more responsive behavior
    inactivityTimerRef.current = setInterval(checkInactivity, 1000)

    return () => {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current)
      }
    }
  }, [lastActivityTime])

  // Auto-restart Firda logo GIF every 15 seconds
  useEffect(() => {
    const logoInterval = setInterval(() => {
      setLogoKey(prev => prev + 1)
    }, 15000)

    return () => clearInterval(logoInterval)
  }, [])

  // Reset activity timer on any interaction
  const resetActivityTimer = () => {
    setLastActivityTime(Date.now())
    setShowSwipeHint(false)
  }

  // Fries Landbouwmuseum Timeline - Nederlandse teksten
  const timelineData = [
    // ETAP 1: Vroegmoderne landbouw (1600-1800)
    {
      id: "golden-age-start",
      year: "1600",
      title: "Gouden Eeuw Landbouw",
      description:
        "De Friese landbouw bloeit tijdens de Nederlandse Gouden Eeuw. Intensieve veeteelt begint en het beroemde Friese vee en paarden krijgen erkenning in heel Europa.",
      gradient: "from-yellow-500 to-orange-500",
      stage: 1,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "land-reclamation",
      year: "1650",
      title: "Landaanwinning Tijdperk",
      description:
        "Grootschalige drainageprojecten transformeren het Friese landschap. Geavanceerde dijkensystemen en polders creëren nieuw landbouwland en leggen de basis voor moderne landbouw.",
      gradient: "from-blue-600 to-cyan-500",
      stage: 1,
    },
    {
      id: "dairy-development",
      year: "1750",
      title: "Zuivelindustrie Fundament",
      description:
        "Traditionele kaasmakerij en boterproductie worden de hoekstenen van de Friese economie. Boerenfamilies ontwikkelen gespecialiseerde zuiveltechnieken die generaties lang worden doorgegeven.",
      gradient: "from-green-600 to-emerald-500",
      stage: 1,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },

    // ETAP 2: Industrialisatie (1800-1950)
    {
      id: "flax-boom",
      year: "1880",
      title: "Vlasproductie Hoogtepunt",
      description:
        "Friesland wordt de grootste vlasproducent van Nederland. Duizenden arbeiders verwerken vlas in 'braakhokken' tijdens de winter, wat cruciale werkgelegenheid biedt op het platteland.",
      gradient: "from-indigo-500 to-blue-500",
      stage: 2,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "mechanization-start",
      year: "1900",
      title: "Landbouwmechanisatie",
      description:
        "Lokale fabrikanten zoals Hermes in Leeuwarden en Miedema in Winsum beginnen met de productie van landbouwwerktuigen, melkmachines en boerenwagens voor de regio.",
      gradient: "from-gray-600 to-slate-500",
      stage: 2,
    },
    {
      id: "cooperatives-birth",
      year: "1920",
      title: "Coöperatieve Beweging",
      description:
        "Boeren stichten de eerste zuivelcoöperaties en landbouwverenigingen. Collectieve koopkracht en gedeelde kennis transformeren traditionele landbouwpraktijken.",
      gradient: "from-purple-600 to-indigo-500",
      stage: 2,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },

    // ETAP 3: Moderne landbouw (1950-heden)
    {
      id: "scientific-breeding",
      year: "1960",
      title: "Wetenschappelijke Veeteelt",
      description:
        "Kunstmatige inseminatie en wetenschappelijke fokprogramma's revolutioneren de rundverbetering. Het Nationaal Veeteelt Museum documenteert deze transformatie van de Friese landbouw.",
      gradient: "from-red-500 to-pink-500",
      stage: 3,
    },
    {
      id: "friesian-renaissance",
      year: "1990",
      title: "Fries Paard Wereldsucces",
      description:
        "Het Friese paard beleeft wereldwijde populariteit. Het Koninklijk Friesch Paarden-Stamboek (KFPS) promoot het ras wereldwijd en maakt het tot een symbool van Nederlands erfgoed.",
      gradient: "from-purple-600 to-pink-500",
      stage: 3,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "sustainable-future",
      year: "2020",
      title: "Erfgoed & Duurzaamheid",
      description:
        "Moderne Friese boerderijen balanceren hightech precisie-landbouw met behoud van traditionele rassen en praktijken. Meer dan 100 zeldzame variëteiten worden behouden voor toekomstige generaties.",
      gradient: "from-green-500 to-teal-600",
      stage: 3,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
  ]

  const handleMouseDown = e => {
    setIsDragging(true)
    setStartX(e.pageX || e.touches[0].pageX)
    setScrollLeft(timelineRef.current.scrollLeft)
    resetActivityTimer()
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
      const timelineItem = timelineData.find(item => item.id === periodId)
      setSelectedPeriod(periodId)
      setSelectedTimelineItem(timelineItem)
      setIsModalOpen(true)
      resetActivityTimer()
      console.log("Navigeer naar periode:", periodId)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedTimelineItem(null)
    setSelectedPeriod(null)
    resetActivityTimer()
  }


  return (
    <div
      className="min-h-screen relative overflow-hidden pt-32"
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onMouseMove={resetActivityTimer}
      onClick={resetActivityTimer}
    >
      {/* Background image - more visible */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundTimelineImg})`,
          backgroundPosition: 'center 50%'
        }}
      />

      {/* Semi-transparent blue overlay to blend with image */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-700/70 to-cyan-600/60" />

      {/* Subtle pattern overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-blue-900/30" />


      <div className="timeline-container py-16 relative w-full h-full z-10">
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
            <div className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 w-full min-w-max shadow-lg shadow-blue-400/50 rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 blur-sm opacity-70 rounded-full"></div>
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
                      whileHover={{
                        scale: 1.05,
                        y: -8,
                        rotateY: 5,
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Jaar */}
                      <div className="text-center mb-6">
                        <motion.div
                          className={`text-5xl font-bold bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent filter drop-shadow-lg`}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {period.year}
                        </motion.div>
                      </div>

                      {/* Kaart */}
                      <motion.div
                        className="relative backdrop-blur-lg bg-white/20 p-8 rounded-3xl border border-white/30 overflow-hidden mb-8 shadow-xl"
                        style={{
                          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
                          background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)"
                        }}
                        animate={{
                          filter:
                            selectedPeriod === period.id
                              ? "drop-shadow(0 25px 50px rgba(244, 63, 94, 0.4))"
                              : "drop-shadow(0 15px 35px rgba(0,0,0,0.3))",
                          backgroundColor:
                            selectedPeriod === period.id
                              ? "rgba(244, 63, 94, 0.1)"
                              : "rgba(255, 255, 255, 0.1)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${period.gradient} opacity-20`}
                        />

                        <div className="relative flex justify-center mb-6">
                          <motion.div
                            className="w-20 h-20 flex items-center justify-center text-4xl backdrop-blur-sm bg-white/20 rounded-2xl border border-white/30 shadow-lg"
                            whileHover={{
                              rotate: [0, -10, 10, -10, 0],
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            🌾
                          </motion.div>
                        </div>

                        <div className="text-center mb-4 relative">
                          <h3
                            className={`text-2xl font-bold bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent leading-tight`}
                          >
                            {period.title}
                          </h3>
                        </div>

                        <div className="text-center relative">
                          <p className="text-gray-200 leading-relaxed">
                            {period.description}
                          </p>
                        </div>

                        <AnimatePresence>
                          {selectedPeriod === period.id && (
                            <motion.div
                              className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-400/50"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="text-white text-sm font-bold">
                                ✓
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Firda Logo - Bottom Left Corner */}
      <motion.div
        className="fixed bottom-2 left-2 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        whileHover={{
          scale: 1.1,
          rotate: [0, -5, 5, -5, 0],
          transition: { duration: 0.5 },
        }}
      >
        <img
          src="./images/firda-logo.gif"
          alt="Firda Logo"
          className="opacity-80 hover:opacity-100 transition-all duration-300 hover:drop-shadow-lg"
          style={{ width: '26rem', height: 'auto' }}
          key={logoKey}
        />
      </motion.div>

      {/* Swipe Hint Animation */}
      <AnimatePresence>
        {showSwipeHint && (
          <motion.div
            className="fixed bottom-20 right-8 z-50 flex items-center space-x-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.8 }}
          >
            {/* Animated finger icon */}
            <motion.div
              className="relative"
              animate={{
                x: [0, -30, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="text-6xl">👆</div>
              {/* Swipe trail effect */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-2 bg-gradient-to-r from-cyan-400 to-transparent rounded-full opacity-70"
                animate={{
                  x: [30, -50, 30],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            {/* Text hint */}
            <motion.div
              className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/30"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-gray-800 font-medium text-lg">
                Veeg met je vinger →
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <TimelineModal
            isOpen={isModalOpen}
            onClose={closeModal}
            timelineItem={selectedTimelineItem}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Timeline
