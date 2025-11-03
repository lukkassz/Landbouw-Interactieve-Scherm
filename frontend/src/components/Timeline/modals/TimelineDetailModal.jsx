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
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"

const TimelineDetailModal = ({ isOpen, onClose, eventData }) => {
  const [activeMedia, setActiveMedia] = useState("image") // 'image', 'gallery', 'video'
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)
  const [isImagePuzzleModalOpen, setIsImagePuzzleModalOpen] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const navigate = useNavigate()
  const theme = getTheme()

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
      icon: null,
      onClick: null,
    },
    {
      label: eventData?.year?.toString() || "1925",
      onClick: null,
    },
    {
      label: eventData?.title || "Oprichting van het museum",
      onClick: null,
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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveMedia("image")
      setIsAudioPlaying(false)
      setSelectedGalleryImage(null)
      setCurrentSlideIndex(0)
      setLightboxIndex(-1)
    }
  }, [isOpen])

  if (!isOpen || !eventData) return null

  const handleAudioGuide = () => {
    setIsAudioPlaying(!isAudioPlaying)
    // TODO: Implement actual audio playback
    console.log("Audio guide toggled:", !isAudioPlaying)
  }

  const handlePuzzleGame = () => {
    setIsImagePuzzleModalOpen(true)
  }

  const handleCloseImagePuzzleModal = () => {
    setIsImagePuzzleModalOpen(false)
  }

  const handleViewCollection = () => {
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

  const handleImageClick = index => {
    setLightboxIndex(index)
  }

  // Get gallery data from configuration
  const galleryConfig = getGalleryData(eventData?.id)
  const galleryImages = galleryConfig.gallery || []
  const mainImage = galleryConfig.mainImage || eventData?.mainImage
  const videoUrl = galleryConfig.video
  const model3dUrl = galleryConfig.model3d

  const renderMediaContent = () => {
    switch (activeMedia) {
      case "video":
        return (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-slate-900 rounded-2xl min-h-0">
            <div className="text-center space-y-2 lg:space-y-4 p-4">
              <Video
                size={48}
                className="mx-auto text-purple-400 animate-pulse lg:w-16 lg:h-16"
              />
              <p className="text-white text-lg lg:text-xl">Historical Video</p>
              <p className="text-slate-400 text-xs lg:text-sm max-w-md mx-auto">
                Archival footage and animated reconstruction
                <br />
                of the museum's founding in 1925.
              </p>
              <motion.button
                className="px-4 lg:px-8 py-2 lg:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold flex items-center gap-2 mx-auto text-sm lg:text-base"
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
                <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative min-h-0">
                  {/* Main Image with Swipe */}
                  <motion.div
                    key={currentSlideIndex}
                    className="w-full h-full relative cursor-pointer"
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
                    onClick={() =>
                      galleryImages[currentSlideIndex]?.src &&
                      handleImageClick(currentSlideIndex)
                    }
                  >
                    {galleryImages[currentSlideIndex]?.src ? (
                      <img
                        src={galleryImages[currentSlideIndex].src}
                        alt={galleryImages[currentSlideIndex].caption}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4 p-4">
                          <ImageIcon
                            size={64}
                            className="mx-auto text-slate-600"
                          />
                          <p className="text-white text-lg lg:text-xl font-semibold">
                            {galleryImages[currentSlideIndex]?.caption}
                          </p>
                          {galleryImages[currentSlideIndex]?.description && (
                            <p className="text-slate-400 text-sm lg:text-base max-w-md mx-auto">
                              {galleryImages[currentSlideIndex].description}
                            </p>
                          )}
                          <p className="text-slate-500 text-xs lg:text-sm italic">
                            Foto wordt binnenkort toegevoegd
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Caption Overlay */}
                    {galleryImages[currentSlideIndex]?.src && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 lg:p-6">
                        <p className="text-white font-bold text-base lg:text-xl mb-1">
                          {galleryImages[currentSlideIndex].caption}
                        </p>
                        {galleryImages[currentSlideIndex].description && (
                          <p className="text-slate-300 text-xs lg:text-sm">
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
                        className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all ${
                          index === currentSlideIndex
                            ? "bg-orange-500 w-6 lg:w-8"
                            : "bg-slate-600 hover:bg-slate-500"
                        }`}
                        onClick={() => setCurrentSlideIndex(index)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-2xl">
                <div className="text-center space-y-4">
                  <ImageIcon size={64} className="mx-auto text-slate-600" />
                  <p className="text-white text-xl lg:text-2xl xl:text-3xl font-semibold">
                    {eventData?.title}
                  </p>
                  <p className="text-slate-400 text-sm lg:text-base">
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
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className={`relative w-full max-w-[85vw] xl:max-w-[80vw] 2xl:max-w-[75vw] h-[85vh] ${theme.background.card} rounded-3xl shadow-2xl overflow-hidden`}
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 z-50 w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg"
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={28} className="text-white" />
            </motion.button>

            {/* Two-Panel Layout */}
            <div className="flex flex-col xl:flex-row h-full">
              {/* LEFT PANEL - Information Section */}
              <div className="w-full xl:w-2/5 p-6 lg:p-8 xl:p-10 overflow-y-auto scrollbar-hide relative">
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
                    <span className={`text-sm font-bold ${theme.text.primary}`}>
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
                      className={`text-base lg:text-lg xl:text-xl font-bold ${theme.text.primary} mb-3`}
                    >
                      Historische Context
                    </h3>
                    <p
                      className={`${theme.text.secondary} leading-relaxed text-sm lg:text-base`}
                    >
                      {eventData.historicalContext ||
                        "In het begin van de 20ste eeuw onderging de Friese zuivelproductie een enorme transformatie. " +
                          "Traditionele ambachtelijke methoden verdwenen snel door industrialisatie. " +
                          "Deze culturele verschuiving bedreigde eeuwenoude kennis en werktuigen met vergetelheid."}
                    </p>
                  </div>

                  {/* Mini-Timeline - Key Moments */}
                  {eventData.id === "museum-foundation" && (
                    <MiniTimeline
                      events={miniTimelineEvents}
                      activeYear={1925}
                    />
                  )}

                  {/* Interactive Map - Museum Locations */}
                  {eventData.id === "museum-foundation" && (
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <MapPin
                          size={24}
                          className="text-orange-500 flex-shrink-0 mt-1"
                        />
                        <div>
                          <h3
                            className={`text-base lg:text-lg xl:text-xl font-bold ${theme.text.primary} mb-1`}
                          >
                            Historische Reis
                          </h3>
                          <p
                            className={`${theme.text.secondary} text-xs lg:text-sm opacity-75`}
                          >
                            Van Eysingahuis naar de huidige locatie
                          </p>
                        </div>
                      </div>
                      <LeeuwardenMap />
                    </div>
                  )}

                  {/* Key Figure */}
                  <div className="bg-slate-800/50 rounded-2xl p-4 lg:p-6">
                    <h3
                      className={`text-base lg:text-lg xl:text-xl font-bold ${theme.text.primary} mb-3`}
                    >
                      Sleutelfiguur: Nanne Ottema
                    </h3>
                    <p
                      className={`${theme.text.secondary} leading-relaxed mb-3 text-sm lg:text-base`}
                    >
                      <strong>Nanne Ottema (1874-1955)</strong>, conservator van
                      het Fries Museum, deed in 1921 een oproep om oude
                      zuivelwerktuigen te bewaren voor toekomstige generaties.
                    </p>
                    <p
                      className={`${theme.text.secondary} text-xs lg:text-sm italic`}
                    >
                      "Deze voorwerpen vertellen het verhaal van onze voorouders
                      en hun vakmanschap."
                    </p>
                  </div>

                  {/* Opening Details */}
                  <div>
                    <h3
                      className={`text-base lg:text-lg xl:text-xl font-bold ${theme.text.primary} mb-3`}
                    >
                      Opening Museum
                    </h3>
                    <p
                      className={`${theme.text.secondary} leading-relaxed text-sm lg:text-base`}
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
                    } hover:brightness-110 text-white rounded-2xl font-bold text-sm lg:text-base xl:text-lg flex items-center justify-center gap-3 shadow-lg min-h-[50px] lg:min-h-[60px]`}
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
                    } hover:brightness-110 text-white rounded-2xl font-bold text-sm lg:text-base xl:text-lg flex items-center justify-center gap-3 shadow-lg min-h-[50px] lg:min-h-[60px]`}
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

                {/* Fun Fact Footer */}
                {eventData.id === "museum-foundation" && (
                  <FunFact fact="Het Eysingahuis stamt uit 1587 en is een rijksmonument." />
                )}
              </div>

              {/* RIGHT PANEL - Media Section */}
              <div className="w-full xl:w-3/5 bg-slate-900 p-6 lg:p-8 xl:p-10 flex flex-col min-h-0">
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
                    className={`px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-base xl:text-lg flex items-center gap-2 lg:gap-3 transition-all min-h-[44px] lg:min-h-[52px] xl:min-h-[60px] ${
                      activeMedia === "image"
                        ? "bg-orange-600 text-white shadow-lg scale-105"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                    onClick={() => setActiveMedia("image")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ImageIcon
                      size={20}
                      className="lg:w-6 lg:h-6 xl:w-7 xl:h-7"
                    />
                    <span>Foto's</span>
                  </motion.button>

                  <motion.button
                    className={`px-4 lg:px-6 xl:px-8 py-3 lg:py-4 xl:py-5 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-base xl:text-lg flex items-center gap-2 lg:gap-3 transition-all min-h-[44px] lg:min-h-[52px] xl:min-h-[60px] ${
                      activeMedia === "video"
                        ? "bg-purple-600 text-white shadow-lg scale-105"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                    onClick={() => setActiveMedia("video")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Video size={20} className="lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
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

      {/* Lightbox for Fullscreen Image View with Zoom */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={galleryImages
          .filter(img => img.src)
          .map(img => ({
            src: img.src,
            alt: img.caption,
            title: img.caption,
            description: img.description,
          }))}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        carousel={{
          finite: false,
          preload: 2,
        }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullDown: true,
          closeOnPullUp: true,
        }}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
          button: {
            filter: "none",
            backgroundColor: "rgba(220, 38, 38, 0.9)",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
          },
          navigationNext: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: "50%",
            padding: "16px",
          },
          navigationPrev: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: "50%",
            padding: "16px",
          },
        }}
        render={{
          buttonPrev:
            galleryImages.filter(img => img.src).length <= 1
              ? () => null
              : undefined,
          buttonNext:
            galleryImages.filter(img => img.src).length <= 1
              ? () => null
              : undefined,
          slideFooter: ({ slide }) => (
            <div className="bg-slate-900/90 backdrop-blur-sm p-4 lg:p-6 text-center">
              <p className="text-white font-bold text-lg lg:text-2xl mb-2">
                {slide.title}
              </p>
              {slide.description && (
                <p className="text-slate-300 text-sm lg:text-base max-w-3xl mx-auto">
                  {slide.description}
                </p>
              )}
              <p className="text-slate-500 text-xs lg:text-sm mt-2">
                {lightboxIndex + 1} /{" "}
                {galleryImages.filter(img => img.src).length}
              </p>
            </div>
          ),
        }}
        animation={{ fade: 300, swipe: 300 }}
      />
    </AnimatePresence>
  )
}

export default TimelineDetailModal
