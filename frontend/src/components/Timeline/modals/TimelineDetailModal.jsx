import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Play,
  Puzzle,
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
import { useSound } from "../../../hooks/useSound"
import { api } from "../../../services/api"

const TimelineDetailModal = ({ isOpen, onClose, eventData }) => {
  const playSound = useSound()
  const [activeMedia, setActiveMedia] = useState("image") // 'image', 'gallery', 'video'
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)
  const [isImagePuzzleModalOpen, setIsImagePuzzleModalOpen] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [eventMedia, setEventMedia] = useState([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [keyMoments, setKeyMoments] = useState([])
  const [isLoadingKeyMoments, setIsLoadingKeyMoments] = useState(false)
  const [eventSections, setEventSections] = useState([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)
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

  // Fetch event media from API when modal opens
  useEffect(() => {
    if (isOpen && eventData?.id) {
      setIsLoadingMedia(true)
      api
        .getEventMedia(eventData.id)
        .then(result => {
          if (result.data && result.data.length > 0) {
            // Convert API media to gallery format
            const apiImages = result.data.map(media => ({
              src: media.file_url,
              caption: media.caption || "",
              alt: media.caption || `Event image ${media.id}`,
            }))
            setEventMedia(apiImages)
          } else {
            setEventMedia([])
          }
        })
        .catch(error => {
          console.warn("Failed to fetch event media:", error)
          setEventMedia([])
        })
        .finally(() => {
          setIsLoadingMedia(false)
        })
    } else {
      setEventMedia([])
    }
  }, [isOpen, eventData?.id])

  // Fetch event sections from API when modal opens
  useEffect(() => {
    if (isOpen && eventData?.id) {
      setIsLoadingSections(true)
      const eventId =
        typeof eventData.id === "string" ? parseInt(eventData.id) : eventData.id
      api
        .getEventSections(eventId)
        .then(result => {
          if (result.data && result.data.length > 0) {
            // Sort sections by section_order
            const sortedSections = result.data.sort(
              (a, b) => (a.section_order || 0) - (b.section_order || 0)
            )
            setEventSections(sortedSections)
          } else {
            setEventSections([])
          }
        })
        .catch(error => {
          console.warn("Failed to fetch event sections:", error)
          setEventSections([])
        })
        .finally(() => {
          setIsLoadingSections(false)
        })
    } else {
      setEventSections([])
    }
  }, [isOpen, eventData?.id])

  // Fetch key moments from API when modal opens
  useEffect(() => {
    console.log("Key moments useEffect triggered:", {
      isOpen,
      eventId: eventData?.id,
      has_key_moments: eventData?.has_key_moments,
      eventData: eventData,
    })

    if (isOpen && eventData?.id && eventData?.has_key_moments) {
      setIsLoadingKeyMoments(true)
      // Convert id to number if it's a string
      const eventId =
        typeof eventData.id === "string" ? parseInt(eventData.id) : eventData.id
      console.log(
        "Fetching key moments for event:",
        eventId,
        "has_key_moments:",
        eventData.has_key_moments,
        "Type of has_key_moments:",
        typeof eventData.has_key_moments
      )
      api
        .getKeyMoments(eventId)
        .then(result => {
          console.log("Key moments API response:", result)
          if (result.data && result.data.length > 0) {
            console.log("Received key moments:", result.data)
            // Convert API key moments to MiniTimeline format
            const moments = result.data.map(moment => ({
              year: parseInt(moment.year) || moment.year,
              title: moment.title || "",
              shortDescription: moment.shortDescription || "",
              fullDescription: moment.fullDescription || "",
            }))
            console.log("Mapped key moments:", moments)
            setKeyMoments(moments)
          } else {
            console.log("No key moments found in response")
            setKeyMoments([])
          }
        })
        .catch(error => {
          console.error("Failed to fetch key moments:", error)
          console.error("Error details:", {
            message: error.message,
            response: error.response,
            status: error.response?.status,
          })
          setKeyMoments([])
        })
        .finally(() => {
          setIsLoadingKeyMoments(false)
        })
    } else {
      console.log("Skipping key moments fetch:", {
        isOpen,
        hasId: !!eventData?.id,
        hasKeyMoments: !!eventData?.has_key_moments,
      })
      setKeyMoments([])
    }
  }, [isOpen, eventData?.id, eventData?.has_key_moments])

  // Use API media if available, otherwise fall back to config gallery images
  const galleryImages = eventMedia.length > 0 ? eventMedia : configGalleryImages

  // Get active year for mini timeline (extract numeric year from event year string)
  const getActiveYear = () => {
    if (!eventData?.year) return null
    const yearMatch = eventData.year.toString().match(/\d{4}/)
    return yearMatch ? parseInt(yearMatch[0]) : null
  }

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

  // Memoize close handler to prevent ImagePuzzleModal re-renders
  const handleCloseImagePuzzleModal = React.useCallback(() => {
    setIsImagePuzzleModalOpen(false)
  }, [])

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
                    className={`text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-4 bg-gradient-to-r ${theme.text.gradient} bg-clip-text text-transparent`}
                  >
                    {eventData.title}
                  </h1>

                  {/* Event Description - Show only if no sections exist */}
                  {eventSections.length === 0 &&
                    !isLoadingSections &&
                    eventData.description && (
                      <p
                        className={`${
                          theme.text.darkSecondary || theme.text.secondary
                        } leading-relaxed text-base lg:text-lg mb-6`}
                      >
                        {eventData.description}
                      </p>
                    )}
                </motion.div>

                {/* Content Sections */}
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Mini-Timeline - Key Moments - Show if event has key moments (BEFORE sections) */}
                  {(() => {
                    if (eventData?.has_key_moments && keyMoments.length > 0) {
                      return (
                        <MiniTimeline
                          events={keyMoments}
                          activeYear={getActiveYear()}
                        />
                      )
                    } else if (
                      eventData?.has_key_moments &&
                      isLoadingKeyMoments
                    ) {
                      return (
                        <div className="text-center py-4">
                          <p
                            className={`text-sm ${
                              theme.text.darkSecondary || "text-gray-500"
                            }`}
                          >
                            Loading key moments...
                          </p>
                        </div>
                      )
                    } else if (eventData?.has_key_moments) {
                      return (
                        <div className="text-center py-4">
                          <p
                            className={`text-sm ${
                              theme.text.darkSecondary || "text-gray-500"
                            }`}
                          >
                            No key moments found for this event.
                          </p>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Event Sections - Dynamic sections from database (if available) - AFTER MiniTimeline */}
                  {eventSections.length > 0 ? (
                    eventSections.map((section, index) => {
                      // Use has_border field from database to determine if section should have card styling
                      const hasBorder =
                        section.has_border === 1 ||
                        section.has_border === true ||
                        section.has_border === "1"
                      return hasBorder ? (
                        <div
                          key={section.id || index}
                          className={`${theme.timeline.cardBg} rounded-2xl p-4 lg:p-6 border ${theme.timeline.cardBorder}`}
                        >
                          <h3
                            className={`text-base lg:text-lg xl:text-xl font-bold ${
                              theme.text.dark || theme.text.primary
                            } mb-3`}
                          >
                            {section.section_title}
                          </h3>
                          <p
                            className={`${
                              theme.text.darkSecondary || theme.text.secondary
                            } leading-relaxed text-sm lg:text-base`}
                          >
                            {section.section_content}
                          </p>
                        </div>
                      ) : (
                        <div key={section.id || index}>
                          <h3
                            className={`text-base lg:text-lg xl:text-xl font-bold ${
                              theme.text.dark || theme.text.primary
                            } mb-3`}
                          >
                            {section.section_title}
                          </h3>
                          <p
                            className={`${
                              theme.text.darkSecondary || theme.text.secondary
                            } leading-relaxed text-sm lg:text-base`}
                          >
                            {section.section_content}
                          </p>
                        </div>
                      )
                    })
                  ) : isLoadingSections ? (
                    <div className="text-center py-4">
                      <p
                        className={`text-sm ${
                          theme.text.darkSecondary || "text-gray-500"
                        }`}
                      >
                        Loading sections...
                      </p>
                    </div>
                  ) : null}

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

                  {/* Puzzle Game Button - Only show if event has puzzle enabled and has puzzle image */}
                  {(() => {
                    // Always log for debugging
                    console.log("Puzzle debug - Full eventData:", eventData)
                    console.log(
                      "Puzzle debug - hasPuzzle value:",
                      eventData?.hasPuzzle,
                      "Type:",
                      typeof eventData?.hasPuzzle
                    )
                    console.log(
                      "Puzzle debug - puzzleImage value:",
                      eventData?.puzzleImage,
                      "Type:",
                      typeof eventData?.puzzleImage
                    )

                    const hasPuzzle =
                      eventData?.hasPuzzle === true ||
                      eventData?.hasPuzzle === 1 ||
                      eventData?.hasPuzzle === "1" ||
                      Boolean(eventData?.hasPuzzle)

                    // Check if puzzleImage exists (not null, not empty, not default fallback)
                    const hasPuzzleImage =
                      eventData?.puzzleImage &&
                      typeof eventData.puzzleImage === "string" &&
                      eventData.puzzleImage.trim() !== "" &&
                      eventData.puzzleImage !== null &&
                      !eventData.puzzleImage.includes("brown_cow_kids")

                    console.log("Puzzle debug - Final check:", {
                      hasPuzzle,
                      hasPuzzleImage,
                      puzzleImage: eventData?.puzzleImage,
                      eventId: eventData?.id,
                      eventTitle: eventData?.title,
                    })

                    return hasPuzzle && hasPuzzleImage
                  })() && (
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
                  )}
                </motion.div>
              </div>

              {/* RIGHT PANEL - Media Section */}
              <div
                className={`w-full xl:w-3/5 bg-gradient-to-br ${theme.background.modal} p-6 lg:p-8 xl:p-10 flex flex-col min-h-0`}
                style={{
                  background:
                    theme.name === "museum"
                      ? "linear-gradient(135deg, rgba(68, 15, 15, 0.98) 0%, rgba(137, 53, 10, 0.95) 50%, rgba(174, 85, 20, 0.98) 100%)"
                      : undefined,
                }}
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
        puzzleImage={(() => {
          if (
            !eventData?.puzzleImage ||
            eventData.puzzleImage.includes("brown_cow_kids")
          ) {
            return null
          }

          const puzzleImg = eventData.puzzleImage

          // If already a full URL, use it
          if (puzzleImg.startsWith("http")) {
            return puzzleImg
          }

          // If starts with /, it's an absolute path
          if (puzzleImg.startsWith("/")) {
            return puzzleImg
          }

          // Build full URL to adminpanel/uploads/
          // Get current origin and construct path
          const origin = window.location.origin
          // Extract base path from current location
          // Current: https://mbo-portal.nl/museumproject/landbouwmuseum/timeline/frontend/...
          // Need: https://mbo-portal.nl/museumproject/landbouwmuseum/timeline/adminpanel/uploads/...
          const currentPath = window.location.pathname
          let basePath = ""

          // Try to extract base path
          if (currentPath.includes("/frontend/")) {
            // Remove /frontend/ and everything after
            basePath = currentPath.split("/frontend/")[0]
          } else if (currentPath.includes("/museumproject/")) {
            // Extract up to /timeline
            const match = currentPath.match(
              /^(\/museumproject\/[^\/]+\/timeline)/
            )
            if (match) {
              basePath = match[1]
            }
          } else {
            // Fallback: try to get from origin + common path
            basePath = "/museumproject/landbouwmuseum/timeline"
          }

          return `${origin}${basePath}/adminpanel/uploads/${puzzleImg}`
        })()}
      />
    </AnimatePresence>
  )
}

export default TimelineDetailModal
