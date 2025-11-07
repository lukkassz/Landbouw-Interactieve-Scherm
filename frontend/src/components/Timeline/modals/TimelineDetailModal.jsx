import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Play,
  Puzzle,
  ExternalLink,
  Image as ImageIcon,
  Video,
  MapPin,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getTheme } from "../../../config/themes"
import {
  getGalleryData,
  hasGallery,
  hasVideo,
} from "../../../config/timelineGalleries"
import ImagePuzzleModal from "../../PuzzleGame/ImagePuzzleModal"
import LeeuwardenMap from "../content/LeeuwardenMap"
import MiniTimeline from "../ui/MiniTimeline"
import Breadcrumb from "../ui/Breadcrumb"
import FunFact from "../content/FunFact"
import { useSound } from "../../../hooks/useSound"

const TimelineDetailModal = ({ isOpen, onClose, eventData }) => {
  const playSound = useSound()
  const [activeMedia, setActiveMedia] = useState("image") // 'image', 'gallery', 'video'
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)
  const [isImagePuzzleModalOpen, setIsImagePuzzleModalOpen] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const navigate = useNavigate()
  const theme = getTheme()

  // Map database event ID to gallery key
  // Event ID 1 (1925) -> 'museum-foundation'
  const getGalleryKey = (eventId, year) => {
    // Map by ID first (most reliable)
    const idMap = {
      1: "museum-foundation", // 1925 - Oprichting van het museum
    }

    if (idMap[eventId]) {
      return idMap[eventId]
    }

    // Fallback: try to map by year or use eventId as string
    return eventId?.toString() || "unknown"
  }

  // Get gallery data from configuration
  const galleryKey = getGalleryKey(eventData?.id, eventData?.year)
  const galleryConfig = getGalleryData(galleryKey)
  const configGalleryImages = galleryConfig.gallery || []
  const mainImage = galleryConfig.mainImage || eventData?.mainImage
  const videoUrl = galleryConfig.video
  const model3dUrl = galleryConfig.model3d

  // Use gallery images from configuration
  const galleryImages = configGalleryImages

  // Mini-timeline data for museum-foundation event
  const miniTimelineEvents = [
    {
      year: 1921,
      title: "Oproep van Nanne Ottema",
      shortDescription: "Oproep om oude zuivelwerktuigen",
      fullDescription:
        "Nanne Ottema doet een oproep om oude zuivelwerktuigen te bewaren voor toekomstige generaties.",
    },
    {
      year: 1925,
      title: "Opening Museum",
      shortDescription: "18 december opent Eysingahuis",
      fullDescription:
        "Het museum opent zijn deuren in de kelders van het Eysingahuis aan de Turfmarkt in Leeuwarden.",
    },
    {
      year: 1929,
      title: "Uitbreiding",
      shortDescription: "Commissie Oude Landbouw",
      fullDescription:
        "De Commissie Oude Landbouw wordt opgericht om de collectie verder uit te breiden.",
    },
  ]

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: "Timeline",
    },
    {
      label: eventData?.year?.toString() || "1925",
    },
    {
      label: eventData?.title || "Oprichting van het museum",
    },
  ]

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Auto-slideshow timer (5 seconds)
  useEffect(() => {
    if (isOpen && activeMedia === "image" && galleryImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % galleryImages.length)
      }, 5000) // 5 seconds

      return () => clearInterval(timer)
    }
  }, [isOpen, activeMedia, galleryImages.length])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveMedia("image")
      setIsAudioPlaying(false)
      setSelectedGalleryImage(null)
      setCurrentSlideIndex(0)
    }
  }, [isOpen])

  if (!isOpen || !eventData) return null

  const handleAudioGuide = () => {
    playSound()
    setIsAudioPlaying(!isAudioPlaying)
    // TODO: Implement actual audio playback
    console.log("Audio guide toggled:", !isAudioPlaying)
  }

  const handlePuzzleGame = () => {
    playSound()
    setIsImagePuzzleModalOpen(true)
  }

  const handleCloseImagePuzzleModal = () => {
    setIsImagePuzzleModalOpen(false)
  }

  const handleViewCollection = () => {
    playSound()
    // TODO: Open filtered collection view
    window.open("https://frieslandbouwmuseum.nl/collectie", "_blank")
  }

  const handleSlideChange = direction => {
    if (galleryImages.length === 0) return

    if (direction === "next") {
      setCurrentSlideIndex(prev => (prev + 1) % galleryImages.length)
    } else {
      setCurrentSlideIndex(
        prev => (prev - 1 + galleryImages.length) % galleryImages.length
      )
    }
  }

  const renderMediaContent = () => {
    switch (activeMedia) {
      case "video":
        return (
          <div
            className={`w-full h-full flex items-center justify-center ${theme.background.modal} rounded-2xl min-h-0`}
          >
            <div className="text-center space-y-2 lg:space-y-4 p-4">
              <Video
                size={48}
                className={`mx-auto ${theme.text.accent} animate-pulse lg:w-16 lg:h-16`}
              />
              <p className={`${theme.text.primary} text-lg lg:text-xl`}>
                Historical Video
              </p>
              <p
                className={`${theme.text.secondary} text-xs lg:text-sm max-w-md mx-auto`}
              >
                Archival footage and animated reconstruction
                <br />
                of the museum's founding in 1925.
              </p>
              <motion.button
                className={`px-4 lg:px-8 py-2 lg:py-3 bg-gradient-to-r ${theme.button.primary} text-white rounded-full font-semibold font-heading flex items-center gap-2 mx-auto text-sm lg:text-base`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={16} className="lg:w-5 lg:h-5" />
                Play Video
              </motion.button>
            </div>
          </div>
        )

      default: // slideshow
        return (
          <div className="w-full h-full flex flex-col min-h-0">
            {galleryImages.length > 0 ? (
              <>
                {/* Slideshow Container */}
                <div
                  className={`flex-1 ${theme.background.modal} rounded-2xl overflow-hidden relative min-h-0`}
                >
                  {/* Main Image with Swipe */}
                  <motion.div
                    key={currentSlideIndex}
                    className="w-full h-full relative cursor-grab active:cursor-grabbing"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x
                      if (swipe > 1000) {
                        handleSlideChange("prev")
                      } else if (swipe < -1000) {
                        handleSlideChange("next")
                      }
                    }}
                  >
                    {galleryImages[currentSlideIndex]?.src ? (
                      <img
                        src={galleryImages[currentSlideIndex].src}
                        alt={galleryImages[currentSlideIndex].caption}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4 p-4">
                          <ImageIcon
                            size={64}
                            className={`mx-auto ${theme.text.secondary}`}
                          />
                          <p
                            className={`${theme.text.primary} text-lg lg:text-xl font-semibold`}
                          >
                            {galleryImages[currentSlideIndex]?.caption}
                          </p>
                          {galleryImages[currentSlideIndex]?.description && (
                            <p
                              className={`${theme.text.secondary} text-sm lg:text-base max-w-md mx-auto`}
                            >
                              {galleryImages[currentSlideIndex].description}
                            </p>
                          )}
                          <p
                            className={`${theme.text.secondary} text-xs lg:text-sm italic opacity-60`}
                          >
                            Foto wordt binnenkort toegevoegd
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Caption Overlay */}
                    {galleryImages[currentSlideIndex]?.src && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 lg:p-6">
                        <p
                          className={`${theme.text.primary} font-bold text-base lg:text-xl mb-1`}
                        >
                          {galleryImages[currentSlideIndex].caption}
                        </p>
                        {galleryImages[currentSlideIndex].description && (
                          <p
                            className={`${theme.text.secondary} text-xs lg:text-sm`}
                          >
                            {galleryImages[currentSlideIndex].description}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Indicators (Dots) */}
                {galleryImages.length > 1 && (
                  <div className="flex justify-center gap-2 lg:gap-3 py-3 lg:py-4 flex-shrink-0">
                    {galleryImages.map((_, index) => (
                      <motion.button
                        key={index}
                        className="rounded-full transition-all"
                        style={{
                          width: index === currentSlideIndex ? "24px" : "8px",
                          height: index === currentSlideIndex ? "12px" : "12px",
                          backgroundColor:
                            index === currentSlideIndex
                              ? theme.name === "museum"
                                ? "#c9a300"
                                : "#06b6d4"
                              : "rgba(255, 255, 255, 0.5)",
                          opacity: index === currentSlideIndex ? 1 : 0.6,
                        }}
                        onClick={() => {
                          playSound()
                          setCurrentSlideIndex(index)
                        }}
                        whileHover={{ scale: 1.2, opacity: 1 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${theme.background.modal} rounded-2xl`}
              >
                <div className="text-center space-y-4">
                  <ImageIcon
                    size={64}
                    className={`mx-auto ${theme.text.secondary}`}
                  />
                  <p
                    className={`${theme.text.primary} text-xl lg:text-2xl xl:text-3xl font-semibold`}
                  >
                    {eventData?.title}
                  </p>
                  <p className={`${theme.text.secondary} text-sm lg:text-base`}>
                    Foto's worden binnenkort toegevoegd
                  </p>
                </div>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSound()
              onClose()
            }}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-[85vw] xl:max-w-[80vw] 2xl:max-w-[75vw] h-[85vh] bg-transparent rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 z-50 w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg"
              onClick={() => {
                playSound()
                onClose()
              }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={28} className="text-white" />
            </motion.button>

            {/* Two-Panel Layout */}
            <div className="flex flex-col xl:flex-row h-full">
              {/* LEFT PANEL - Information Section */}
              <div
                className={`w-full xl:w-2/5 p-6 lg:p-8 xl:p-10 overflow-y-auto scrollbar-hide relative ${
                  theme.background.modalLight || theme.background.card
                }`}
              >
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={breadcrumbItems} />

                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-full ${theme.background.primary} mb-4`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        theme.text.dark || theme.text.primary
                      }`}
                    >
                      {eventData.year}
                    </span>
                  </div>
                  <h1
                    className={`text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 bg-gradient-to-r ${theme.text.gradient} bg-clip-text text-transparent`}
                  >
                    {eventData.title}
                  </h1>
                </motion.div>

                {/* Content Sections */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Historical Context */}
                  <div>
                    <h3
                      className={`text-base lg:text-lg xl:text-xl font-bold ${
                        theme.text.dark || theme.text.primary
                      } mb-3`}
                    >
                      Historische Context
                    </h3>
                    <p
                      className={`${
                        theme.text.darkSecondary || theme.text.secondary
                      } leading-relaxed text-sm lg:text-base`}
                    >
                      {eventData.historicalContext ||
                        "In het begin van de 20ste eeuw onderging de Friese zuivelproductie een enorme transformatie. " +
                          "Traditionele ambachtelijke methoden verdwenen snel door industrialisatie. " +
                          "Deze culturele verschuiving bedreigde eeuwenoude kennis en werktuigen met vergetelheid."}
                    </p>
                  </div>

                  {/* Mini-Timeline - Key Moments - Only for 1925 event */}
                  {(eventData.year === "1925" ||
                    eventData.id === "1" ||
                    eventData.id === "museum-foundation") && (
                    <MiniTimeline
                      events={miniTimelineEvents}
                      activeYear={1925}
                    />
                  )}

                  {/* Interactive Map - Museum Locations - Only for 1925 event */}
                  {(eventData.year === "1925" ||
                    eventData.id === "1" ||
                    eventData.id === "museum-foundation") && (
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <MapPin
                          size={24}
                          className="text-orange-500 flex-shrink-0 mt-1"
                        />
                        <div>
                          <h3
                            className={`text-base lg:text-lg xl:text-xl font-bold ${
                              theme.text.dark || theme.text.primary
                            } mb-1`}
                          >
                            Historische Reis
                          </h3>
                          <p
                            className={`${
                              theme.text.darkSecondary || theme.text.secondary
                            } text-xs lg:text-sm opacity-75`}
                          >
                            Van Eysingahuis naar de huidige locatie
                          </p>
                        </div>
                      </div>
                      <LeeuwardenMap />
                    </div>
                  )}

                  {/* Key Figure */}
                  <div
                    className={`${theme.timeline.cardBg} rounded-2xl p-4 lg:p-6 border ${theme.timeline.cardBorder}`}
                  >
                    <h3
                      className={`text-base lg:text-lg xl:text-xl font-bold ${
                        theme.text.dark || theme.text.primary
                      } mb-3`}
                    >
                      Sleutelfiguur: Nanne Ottema
                    </h3>
                    <p
                      className={`${
                        theme.text.darkSecondary || theme.text.secondary
                      } leading-relaxed mb-3 text-sm lg:text-base`}
                    >
                      <strong>Nanne Ottema (1874-1955)</strong>, conservator van
                      het Fries Museum, deed in 1921 een oproep om oude
                      zuivelwerktuigen te bewaren voor toekomstige generaties.
                    </p>
                    <p
                      className={`${
                        theme.text.darkSecondary || theme.text.secondary
                      } text-xs lg:text-sm italic`}
                    >
                      "Deze voorwerpen vertellen het verhaal van onze voorouders
                      en hun vakmanschap."
                    </p>
                  </div>

                  {/* Opening Details */}
                  <div>
                    <h3
                      className={`text-base lg:text-lg xl:text-xl font-bold ${
                        theme.text.dark || theme.text.primary
                      } mb-3`}
                    >
                      Opening Museum
                    </h3>
                    <p
                      className={`${
                        theme.text.darkSecondary || theme.text.secondary
                      } leading-relaxed text-sm lg:text-base`}
                    >
                      Op <strong>18 december 1925</strong> opende het museum
                      zijn deuren in de kelders van het Eysingahuis aan de
                      Turfmarkt in Leeuwarden. Deze bescheiden start zou
                      uitgroeien tot een belangrijke bewaarplek van Friese
                      landbouwgeschiedenis.
                    </p>
                  </div>
                </motion.div>

                {/* Interactive Buttons */}
                <motion.div
                  className="space-y-4 lg:space-y-6 mt-6 lg:mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Audio Guide Button */}
                  <motion.button
                    className={`w-full py-4 lg:py-5 px-6 lg:px-8 bg-gradient-to-r ${
                      theme.name === "museum"
                        ? "from-brand-gold to-brand-amber"
                        : "from-yellow-500 to-amber-600"
                    } hover:brightness-110 text-white rounded-2xl font-bold font-heading text-sm lg:text-base xl:text-lg flex items-center justify-center gap-3 shadow-lg min-h-[50px] lg:min-h-[60px]`}
                    onClick={handleAudioGuide}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Play
                      size={24}
                      className={isAudioPlaying ? "animate-pulse" : ""}
                    />
                    {isAudioPlaying
                      ? "Audio Guide aan het spelen..."
                      : "Audio Guide"}
                  </motion.button>

                  {/* Puzzle Game Button */}
                  <motion.button
                    className={`w-full py-4 lg:py-5 px-6 lg:px-8 bg-gradient-to-r ${
                      theme.name === "museum"
                        ? "from-brand-rust to-brand-terracotta"
                        : "from-orange-600 to-red-600"
                    } hover:brightness-110 text-white rounded-2xl font-bold font-heading text-sm lg:text-base xl:text-lg flex items-center justify-center gap-3 shadow-lg min-h-[50px] lg:min-h-[60px]`}
                    onClick={handlePuzzleGame}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Puzzle size={24} />
                    Speel Puzzle
                  </motion.button>

                  {/* View Collection Button */}
                  <motion.button
                    className={`w-full py-4 lg:py-5 px-6 lg:px-8 ${
                      theme.name === "museum"
                        ? "bg-brand-slate hover:bg-brand-maroon"
                        : "bg-slate-700 hover:bg-slate-600"
                    } text-white rounded-2xl font-bold text-sm lg:text-base xl:text-lg flex items-center justify-center gap-3 shadow-lg min-h-[50px] lg:min-h-[60px]`}
                    onClick={handleViewCollection}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink size={24} />
                    Bekijk originele objecten
                  </motion.button>
                </motion.div>

                {/* Fun Fact Footer - Only for 1925 event */}
                {(eventData.year === "1925" ||
                  eventData.id === "1" ||
                  eventData.id === "museum-foundation") && (
                  <FunFact fact="Het Eysingahuis stamt uit 1587 en is een rijksmonument." />
                )}
              </div>

              {/* RIGHT PANEL - Media Section */}
              <div
                className={`w-full xl:w-3/5 ${theme.background.modal} p-6 lg:p-8 xl:p-10 flex flex-col min-h-0`}
              >
                {/* Media Preview Area */}
                <motion.div
                  className="flex-1 mb-4 lg:mb-6 min-h-0 overflow-hidden"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {renderMediaContent()}
                </motion.div>

                {/* Media Toggle Buttons */}
                <motion.div
                  className="flex gap-2 lg:gap-3 xl:gap-4 justify-center flex-wrap flex-shrink-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    className={`px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-bold text-sm lg:text-base flex items-center gap-2 transition-all min-h-[40px] lg:min-h-[44px] ${
                      activeMedia === "image"
                        ? `bg-gradient-to-r ${theme.button.primary} text-white shadow-lg scale-105`
                        : `${theme.button.secondary} ${theme.text.secondary}`
                    }`}
                    onClick={() => {
                      playSound()
                      setActiveMedia("image")
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ImageIcon size={18} className="lg:w-5 lg:h-5" />
                    <span>Foto's</span>
                  </motion.button>

                  <motion.button
                    className={`px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-bold text-sm lg:text-base flex items-center gap-2 transition-all min-h-[40px] lg:min-h-[44px] ${
                      activeMedia === "video"
                        ? `bg-gradient-to-r ${theme.button.primary} text-white shadow-lg scale-105`
                        : `${theme.button.secondary} ${theme.text.secondary}`
                    }`}
                    onClick={() => {
                      playSound()
                      setActiveMedia("video")
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Video size={18} className="lg:w-5 lg:h-5" />
                    <span>Video</span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Image Puzzle Modal (nested) */}
      <ImagePuzzleModal
        isOpen={isImagePuzzleModalOpen}
        onClose={handleCloseImagePuzzleModal}
      />
    </AnimatePresence>
  )
}

export default TimelineDetailModal
