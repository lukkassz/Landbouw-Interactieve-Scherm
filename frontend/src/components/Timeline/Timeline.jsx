import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import TimelineModal from "./modals/TimelineModal"
import TimelineDetailModal from "./modals/TimelineDetailModal"
import MuseumHeadline from "./content/MuseumHeadline"
import VirtualGuide from "./content/VirtualGuide"
import ThemeSwitcher from "../Common/ThemeSwitcher"
import StudentenwerkLogo from "../Common/StudentenwerkLogo"
import { getTheme } from "../../config/themes"

// Import puzzle images
import puzzleImg from "../../assets/images/puzzle/brown_cow_kids.jpg"
// Import background image
import backgroundTimelineImg from "../../assets/images/timeline/achtergrond3.png"

const Timeline = () => {
  const theme = getTheme()
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const timelineRef = useRef(null)

  // Preload background image for faster loading
  useEffect(() => {
    const img = new Image()
    img.src = backgroundTimelineImg
  }, [])

  // Fries Landbouwmuseum Timeline - 100 jaar geschiedenis (1925-2025)
  const timelineData = [
    {
      id: "museum-foundation",
      year: "1925",
      title: "Oprichting van het museum",
      description:
        "Het Fries Landbouwmuseum begint met een bescheiden zuivelexpositie in Leeuwarden. De eerste stap om verdwijnende melk-, boter- en kaasproductiemethoden te bewaren voor toekomstige generaties.",
      gradient: "from-amber-600 to-orange-500",
      museumGradient: "from-brand-rust to-brand-terracotta",
      stage: 1,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
      // Enhanced data for detailed modal
      useDetailedModal: true,
      historicalContext: "In het begin van de 20ste eeuw onderging de Friese zuivelproductie een enorme transformatie. Traditionele ambachtelijke methoden verdwenen snel door industrialisatie. Deze culturele verschuiving bedreigde eeuwenoude kennis en werktuigen met vergetelheid."
    },
    {
      id: "eysingahuis-expansion",
      year: "1930–1956",
      title: "Eysingahuis en Stania State",
      description:
        "Uitbreiding van de collectie met landbouwgereedschap, verhuizing naar Stania State in Oentsjerk, ontwikkeling van de verzameling dankzij nieuwe ruimtes.",
      gradient: "from-blue-600 to-cyan-500",
      museumGradient: "from-brand-sky to-brand-mist",
      stage: 1,
    },
    {
      id: "postwar-growth",
      year: "1945–1987",
      title: "Na de oorlog, groei, verplaatsingen",
      description:
        "Na de Tweede Wereldoorlog snelle uitbreiding van de collectie, diverse tijdelijke locaties (Exmorra, Achlum), financiële uitdagingen, steeds meer nadruk op educatie en behoud van erfgoed.",
      gradient: "from-slate-600 to-gray-500",
      museumGradient: "from-brand-slate to-brand-maroon",
      stage: 1,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "exmorra-restart",
      year: "1987",
      title: "Nieuwe start in Exmorra",
      description:
        "Officiële heropening als Fries Landbouwmuseum, eerste provinciale subsidie, duidelijke missie: ontwikkelingen van de Friese landbouw tonen vanaf de vroegste tijden tot nu.",
      gradient: "from-green-600 to-emerald-500",
      museumGradient: "from-brand-olive to-brand-mist",
      stage: 2,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "earnewald-professionalization",
      year: "2006",
      title: "Verhuizing naar Earnewâld, professionalisering",
      description:
        "Samenwerking met It Fryske Gea, aanzienlijke uitbreiding van de collectie met objecten uit het museum Wageingen en de 'Ús Mem'-collectie.",
      gradient: "from-indigo-600 to-purple-500",
      museumGradient: "from-brand-amber to-brand-terracotta",
      stage: 2,
    },
    {
      id: "leeuwarden-location",
      year: "2018",
      title: "Nieuwe locatie Leeuwarden",
      description:
        "Het museum vestigt zich in de monumentale boerderij aan de zuidrand van Leeuwarden, meer ruimte voor groei en samenwerking met kennisinstellingen uit de Dairy Valley.",
      gradient: "from-rose-600 to-pink-500",
      museumGradient: "from-brand-rust to-brand-gold",
      stage: 2,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "collection-expansion",
      year: "2020",
      title: "Uitbreiding van de collectie",
      description:
        "Integratie van de collectie van Stichting Ús Mem en het Nationaal Veeteeltmuseum, presentatie van iconen zoals de fokstier 'Sunny Boy'.",
      gradient: "from-teal-600 to-cyan-500",
      museumGradient: "from-brand-mist to-brand-sky",
      stage: 3,
    },
    {
      id: "renewal-jubilee",
      year: "2023–2025",
      title: "Vernieuwing en jubileum",
      description:
        "Grondige modernisering van het museum, uitbreiding met nieuwe zalen, bibliotheek en educatieve ruimte, opening van de expositie 'De Wereld van het Friese Paard', voortzetting van provinciale subsidiëring, officiële viering van het 100-jarig jubileum in december 2025.",
      gradient: "from-yellow-500 to-amber-600",
      museumGradient: "from-brand-gold to-brand-amber",
      stage: 3,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
    {
      id: "future-exhibitions",
      year: "2026",
      title: "Toekomstgerichte exposities",
      description:
        "Start van exposities over het internationale voedselsysteem, samenwerking met universiteiten en nieuwe maatschappelijke thema's in het museumverhaal.",
      gradient: "from-violet-600 to-fuchsia-500",
      museumGradient: "from-brand-amber to-brand-rust",
      stage: 3,
      hasPuzzle: true,
      puzzleImage: puzzleImg,
    },
  ]

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

  return (
    <div
      className="min-h-screen relative overflow-hidden pt-32"
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Background image - more visible */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundTimelineImg})`,
          backgroundPosition: "center 50%",
        }}
      />

      {/* Theme-based overlay to blend with image */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.background.primary}`} />

      {/* Subtle pattern overlay for depth */}
      <div className={`absolute inset-0 bg-gradient-to-t ${theme.background.overlay}`} />

      {/* Theme Switcher */}
      <ThemeSwitcher />

      {/* Studentenwerk Logo */}
      <StudentenwerkLogo />

      {/* Virtual Guide Mascot */}
      <VirtualGuide
        messages={[
          "Tik op een tijdperk om meer te weten te komen!",
          "Veeg naar links of rechts om door de geschiedenis te bladeren!",
          "Ontdek 100 jaar Fries Landbouwmuseum!"
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
            <div className={`absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r ${theme.timeline.line} w-full min-w-max shadow-lg rounded-full`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.timeline.line} blur-sm opacity-70 rounded-full`}></div>
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
                      {/* Jaar */}
                      <div className="text-center mb-6">
                        <motion.div
                          className={`text-5xl font-bold bg-gradient-to-r ${theme.name === 'museum' ? period.museumGradient : period.gradient} bg-clip-text text-transparent filter drop-shadow-lg`}
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
                        className={`relative ${theme.timeline.cardBg} p-8 rounded-3xl border ${theme.timeline.cardBorder} overflow-hidden mb-8 shadow-xl ${theme.name === 'modern' ? 'backdrop-blur-lg' : ''}`}
                        style={{
                          filter: theme.name === 'modern'
                            ? "drop-shadow(0 20px 40px rgba(0,0,0,0.4))"
                            : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                        }}
                        animate={{
                          filter:
                            selectedPeriod === period.id
                              ? theme.name === 'modern'
                                ? "drop-shadow(0 25px 50px rgba(244, 63, 94, 0.4))"
                                : "drop-shadow(0 6px 20px rgba(201,163,0,0.3))"
                              : theme.name === 'modern'
                              ? "drop-shadow(0 15px 35px rgba(0,0,0,0.3))"
                              : "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Gradient overlay - only in modern theme */}
                        {theme.name === 'modern' && (
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${period.gradient} opacity-20`}
                          />
                        )}

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
                            className={`text-2xl font-bold bg-gradient-to-r ${theme.name === 'museum' ? period.museumGradient : period.gradient} bg-clip-text text-transparent leading-tight`}
                          >
                            {period.title}
                          </h3>
                        </div>

                        <div className="text-center relative">
                          <p className={`leading-relaxed ${theme.name === 'modern' ? 'text-gray-200' : theme.text.secondary}`}>
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
