import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Puzzle,
  Image as ImageIcon,
  Video,
  MapPin,
  Clock,
  Brain,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getGalleryData } from "../../../config/timelineGalleries"
import ImagePuzzleModal from "../../PuzzleGame/ImagePuzzleModal"
import MemoryGame from "../../PuzzleGame/MemoryGame"
import LeeuwardenMap from "../content/LeeuwardenMap"
import MiniTimeline from "../ui/MiniTimeline"
import Breadcrumb from "../ui/Breadcrumb"
import { useSound } from "../../../hooks/useSound"
import { api } from "../../../services/api"

// Import Landbouw Icon
import landbouwIcon from "../../../assets/icons/landbouw-model.png"

const TimelineDetailModal = ({ isOpen, onClose, eventData }) => {
  const playSound = useSound()
  const [activeMedia, setActiveMedia] = useState("image")
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null)
  const [isImagePuzzleModalOpen, setIsImagePuzzleModalOpen] = useState(false)
  const [isMemoryGameModalOpen, setIsMemoryGameModalOpen] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoVolume, setVideoVolume] = useState(1)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const videoRef = React.useRef(null)
  const [eventMedia, setEventMedia] = useState([])
  const [eventVideos, setEventVideos] = useState([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [keyMoments, setKeyMoments] = useState([])
  const [isLoadingKeyMoments, setIsLoadingKeyMoments] = useState(false)
  const [eventSections, setEventSections] = useState([])
  const [isLoadingSections, setIsLoadingSections] = useState(false)
  const [puzzleImageUrl, setPuzzleImageUrl] = useState(null)
  const [isLoadingPuzzleUrl, setIsLoadingPuzzleUrl] = useState(false)
  const navigate = useNavigate()

  // Determine Category Style
  const isLandbouw =
    eventData?.category === "Landbouw" || eventData?.category === "landbouw"
  const isMaatschappelijk =
    eventData?.category === "Maatschappelijk" ||
    eventData?.category === "maatschappelijk" ||
    eventData?.category === "society" // Assuming backend might send different strings
  const isMuseum = !isLandbouw && !isMaatschappelijk

  // Theme Configuration
  let theme = {}

  if (isLandbouw) {
    // Landbouw Theme (Rustic Paper / Pergamin) - Darker/Richer version
    theme = {
      bg: "bg-[#e6dbbf] bg-[radial-gradient(circle_at_center,#f2ebd4_0%,#d9ceae_100%)] shadow-[inset_0_0_40px_rgba(58,45,32,0.1)] relative before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnPjxmaWx0ZXIgaWQ9J25vaXNlJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC44JyBudW1PY3RhdmVzPSczJyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsdGVyPSd1cmwoI25vaXNlKScgb3BhY2l0eT0nMC40Jy8+PC9zdmc+')] before:opacity-60 before:pointer-events-none before:z-0 before:mix-blend-multiply",
      text: "text-[#3a2d20]",
      textMuted: "text-[#6b5a45]",
      heading: "text-[#42301e]", // Darker brown heading
      accent: "text-[#42301e]",
      accentBg: "bg-[#5c7a4f]", // Darker green for stamp
      accentBorder: "border-[#42301e]",
      cardBg: "bg-[#e6dfc8]/80 backdrop-blur-sm", // Slightly darker paper for cards
      cardBorder: "border-[#d1c7a7]",
      buttonPrimary: "bg-[#7c8f38] text-[#f3eeda] hover:bg-[#66752e] shadow-md", // Green button
      buttonSecondary: "bg-[#5e4b35] text-[#f3eeda] hover:bg-[#4a3b2a]", // Brown button for toggles
      closeBtn: "bg-[#5e4b35]/10 hover:bg-[#5e4b35]/20 text-[#5e4b35]",
      timelineLine: "bg-[#7c8f38]",
    }
  } else if (isMaatschappelijk) {
    // Maatschappelijk Theme (Old Newspaper)
    theme = {
      bg: "bg-[#f0f0f0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]", // Light greyish paper texture
      text: "text-[#1a1a1a] font-serif", // Nearly black, serif for body
      textMuted: "text-[#555555]",
      heading: "text-[#111111] font-serif font-black tracking-tight uppercase", // Bold headline style
      accent: "text-[#000000]",
      accentBg: "bg-[#e5e5e5]",
      accentBorder: "border-[#333333]",
      cardBg: "bg-white/50 border-b border-black/20", // Simple dividers
      cardBorder: "border-black",
      buttonPrimary:
        "bg-[#333333] text-[#f5f5f5] hover:bg-[#000000] border border-black font-bold shadow-sm uppercase tracking-wider", // Dark, serious button
      buttonSecondary:
        "bg-[#e5e5e5] text-[#111111] border border-[#999999] hover:bg-[#d5d5d5] font-bold shadow-sm uppercase tracking-wider", // Light, serious button
      closeBtn:
        "bg-black/10 hover:bg-black/20 text-black rounded-full w-10 h-10 border border-black/30",
      timelineLine: "bg-[#333333]",
    }
  } else {
    // History Theme (Default Museum) - Realistic Old Book Look
    theme = {
      bg: "bg-[#f7f5eb]", // Old paper color
      text: "text-[#3c2f2f] leading-relaxed", // Dark brown ink text
      textMuted: "text-[#8c7b75]", // Muted brown
      heading: "text-[#4a3728] font-heading tracking-wide", // Dark Leather Brown
      accent: "text-[#8b4513]",
      accentBg: "bg-[#e6e0d0]",
      accentBorder: "border-[#d1c7a7]",
      cardBg: "bg-transparent border-none shadow-none", // Clean text on paper
      cardBorder: "border-transparent",
      buttonPrimary:
        "bg-[#5c4033] text-[#f3eeda] border border-[#3e2b22] shadow-[0_2px_4px_rgba(0,0,0,0.3)] hover:bg-[#4a332a] font-heading rounded-lg", // Leather button style
      buttonSecondary:
        "bg-[#e8dfc5] text-[#5c4033] border border-[#c9bfa8] shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:bg-[#dcd3b9] font-heading rounded-lg", // Paper button style
      closeBtn:
        "bg-[#5c4033] text-[#f3eeda] border border-[#3e2b22] shadow-md hover:bg-[#4a332a] rounded-full w-10 h-10", // Leather close button
      timelineLine: "bg-[#8b4513]",
    }
  }

  // ... [Data Fetching Hooks - Same as before] ...
  const getGalleryKey = (eventId, year) => {
    const idMap = { 1: "museum-foundation" }
    if (idMap[eventId]) return idMap[eventId]
    return eventId?.toString() || "unknown"
  }

  const galleryKey = getGalleryKey(eventData?.id, eventData?.year)
  const galleryConfig = getGalleryData(galleryKey)
  const configGalleryImages = galleryConfig.gallery || []

  useEffect(() => {
    if (isOpen && eventData?.id) {
      setIsLoadingMedia(true)
      api
        .getEventMedia(eventData.id)
        .then(result => {
          if (result.data && result.data.length > 0) {
            // Helper function to detect media type from file extension if media_type is missing
            const detectMediaType = media => {
              // First check if media_type is explicitly set
              if (media.media_type === "video") {
                return "video"
              }
              if (media.media_type === "image") {
                return "image"
              }

              // Fallback: detect from file extension in URL
              const fileUrl = media.file_url || ""
              const videoExtensions = [
                ".mp4",
                ".webm",
                ".ogg",
                ".avi",
                ".mov",
                ".quicktime",
                "video/",
              ]
              const imageExtensions = [
                ".jpg",
                ".jpeg",
                ".png",
                ".gif",
                ".webp",
                ".bmp",
                "image/",
              ]

              const lowerUrl = fileUrl.toLowerCase()

              // Check for video extensions (must be at the end of filename or in path)
              const hasVideoExt = videoExtensions.some(ext => {
                if (ext.includes("/")) {
                  return lowerUrl.includes(ext)
                }
                // For file extensions, check if it's at the end of the filename
                const filename = lowerUrl.split("/").pop() || ""
                return filename.endsWith(ext) || filename.includes(ext)
              })

              if (hasVideoExt) {
                console.log("Detected VIDEO from URL:", fileUrl)
                return "video"
              }

              // Check for image extensions
              const hasImageExt = imageExtensions.some(ext => {
                if (ext.includes("/")) {
                  return lowerUrl.includes(ext)
                }
                const filename = lowerUrl.split("/").pop() || ""
                return filename.endsWith(ext) || filename.includes(ext)
              })

              if (hasImageExt) {
                return "image"
              }

              // Default to image if cannot determine
              console.warn(
                "Cannot determine media type for:",
                fileUrl,
                "defaulting to image"
              )
              return "image"
            }

            // Separate images and videos based on media_type or file extension
            const images = []
            const videos = []

            result.data.forEach(media => {
              const detectedType = detectMediaType(media)
              const mediaItem = {
                src: media.file_url,
                caption: media.caption || "",
                alt: media.caption || `Event ${detectedType} ${media.id}`,
              }

              if (detectedType === "video") {
                videos.push(mediaItem)
              } else {
                images.push(mediaItem)
              }
            })

            console.log("Media filtering:", {
              total: result.data.length,
              images: images.length,
              videos: videos.length,
              rawData: result.data.map(m => ({
                id: m.id,
                media_type: m.media_type,
                file_url: m.file_url,
                detected: detectMediaType(m),
              })),
            })

            setEventMedia(images)
            setEventVideos(videos)
          } else {
            setEventMedia([])
            setEventVideos([])
          }
        })
        .finally(() => setIsLoadingMedia(false))
    } else {
      setEventMedia([])
      setEventVideos([])
    }
  }, [isOpen, eventData?.id])

  useEffect(() => {
    if (isOpen && eventData?.id) {
      setIsLoadingSections(true)
      const eventId =
        typeof eventData.id === "string" ? parseInt(eventData.id) : eventData.id
      api
        .getEventSections(eventId)
        .then(result => {
          if (result.data && result.data.length > 0) {
            setEventSections(
              result.data.sort(
                (a, b) => (a.section_order || 0) - (b.section_order || 0)
              )
            )
          } else setEventSections([])
        })
        .finally(() => setIsLoadingSections(false))
    } else setEventSections([])
  }, [isOpen, eventData?.id])

  useEffect(() => {
    if (isOpen && eventData?.id && eventData?.has_key_moments) {
      setIsLoadingKeyMoments(true)
      const eventId =
        typeof eventData.id === "string" ? parseInt(eventData.id) : eventData.id
      api
        .getKeyMoments(eventId)
        .then(result => {
          if (result.data && result.data.length > 0) {
            setKeyMoments(
              result.data.map(moment => ({
                year: parseInt(moment.year) || moment.year,
                title: moment.title || "",
                shortDescription: moment.shortDescription || "",
                fullDescription: moment.fullDescription || "",
              }))
            )
          } else setKeyMoments([])
        })
        .finally(() => setIsLoadingKeyMoments(false))
    } else setKeyMoments([])
  }, [isOpen, eventData?.id, eventData?.has_key_moments])

  useEffect(() => {
    if (isOpen) {
      const puzzleImg =
        eventData?.puzzle_image_url ||
        eventData?.puzzleImage ||
        eventData?.puzzle_image
      if (puzzleImg && puzzleImg.trim() !== "" && puzzleImg !== "null") {
        setIsLoadingPuzzleUrl(true)
        api
          .getPuzzleImageUrl(puzzleImg)
          .then(data => {
            if (data.success && data.url) setPuzzleImageUrl(data.url)
            else setPuzzleImageUrl(null)
          })
          .catch(() => {
            setPuzzleImageUrl(null)
          })
          .finally(() => setIsLoadingPuzzleUrl(false))
      } else setPuzzleImageUrl(null)
    }
  }, [isOpen, eventData?.puzzle_image_url])

  // Only use images for galleryImages - NEVER include videos
  // Double-check: filter out any videos that might have slipped through
  const isVideoFile = url => {
    if (!url) return false
    const videoExtensions = [
      ".mp4",
      ".webm",
      ".ogg",
      ".avi",
      ".mov",
      ".quicktime",
      "video/",
    ]
    const lowerUrl = url.toLowerCase()
    // Check if URL ends with video extension or contains video/ in path
    const filename = lowerUrl.split("/").pop() || ""
    return videoExtensions.some(ext => {
      if (ext.includes("/")) {
        return lowerUrl.includes(ext)
      }
      return filename.endsWith(ext) || filename.includes(ext)
    })
  }

  // Filter out any videos that might have slipped through
  const filteredEventMedia = eventMedia.filter(item => {
    const isVideo = isVideoFile(item.src)
    if (isVideo) {
      console.warn(
        "Video found in eventMedia, moving to eventVideos:",
        item.src
      )
    }
    return !isVideo
  })

  const galleryImages =
    filteredEventMedia.length > 0 ? filteredEventMedia : configGalleryImages

  // Debug log
  useEffect(() => {
    if (isOpen) {
      console.log("Current media state:", {
        eventMedia: eventMedia.length,
        eventVideos: eventVideos.length,
        galleryImages: galleryImages.length,
        activeMedia,
        eventMediaItems: eventMedia.map(m => m.src),
        eventVideosItems: eventVideos.map(v => v.src),
      })
    }
  }, [isOpen, eventMedia, eventVideos, galleryImages, activeMedia])

  const getActiveYear = () => {
    if (!eventData?.year) return null
    const yearMatch = eventData.year.toString().match(/\d{4}/)
    return yearMatch ? parseInt(yearMatch[0]) : null
  }

  const breadcrumbItems = [
    { label: "Timeline" },
    { label: eventData?.year?.toString() || "1925" },
    { label: eventData?.title || "Oprichting van het museum" },
  ]

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && activeMedia === "image" && galleryImages.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % galleryImages.length)
      }, 5000)
      return () => clearInterval(timer)
    }
    // Reset indices when switching media types
    if (isOpen && activeMedia === "image") {
      setCurrentSlideIndex(0)
    } else if (isOpen && activeMedia === "video") {
      setCurrentVideoIndex(0)
    }
  }, [isOpen, activeMedia, galleryImages.length])

  useEffect(() => {
    if (!isOpen) {
      setActiveMedia("image")
      setSelectedGalleryImage(null)
      setCurrentSlideIndex(0)
      setCurrentVideoIndex(0)
      setIsVideoPlaying(false)
      setVideoVolume(1)
      setIsVideoMuted(false)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isOpen])

  // Sync video state with ref
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsVideoPlaying(true)
    const handlePause = () => setIsVideoPlaying(false)
    const handleVolumeChange = () => {
      setVideoVolume(video.volume)
      setIsVideoMuted(video.muted)
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("volumechange", handleVolumeChange)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("volumechange", handleVolumeChange)
    }
  }, [currentVideoIndex, activeMedia])

  // Handle video play/pause
  const handleVideoPlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isVideoPlaying) {
      video.pause()
    } else {
      video.play().catch(e => console.debug("Failed to play video:", e))
    }
  }

  // Handle volume change
  const handleVolumeChange = e => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVideoVolume(newVolume)
    setIsVideoMuted(newVolume === 0)
  }

  // Handle mute toggle
  const handleMuteToggle = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsVideoMuted(video.muted)
  }

  if (!isOpen || !eventData) return null

  const handlePuzzleGame = () => {
    playSound()
    setIsImagePuzzleModalOpen(true)
  }
  const handleMemoryGame = () => {
    playSound()
    setIsMemoryGameModalOpen(true)
  }
  const handleCloseImagePuzzleModal = React.useCallback(
    () => setIsImagePuzzleModalOpen(false),
    []
  )
  const handleCloseMemoryGameModal = React.useCallback(
    () => setIsMemoryGameModalOpen(false),
    []
  )

  const handleSlideChange = direction => {
    if (galleryImages.length === 0) return
    if (direction === "next")
      setCurrentSlideIndex(prev => (prev + 1) % galleryImages.length)
    else
      setCurrentSlideIndex(
        prev => (prev - 1 + galleryImages.length) % galleryImages.length
      )
  }

  // Updated Media Renderer with "Wooden Frame" support for Landbouw and "Photo Album" for Museum
  const renderMediaContent = () => {
    const isMuseum = !isLandbouw && !isMaatschappelijk
    const frameClass = isLandbouw
      ? "border-[12px] border-[#5e4b35] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] rounded-sm"
      : isMaatschappelijk
      ? "p-1 bg-white shadow-sm border border-black/20" // Newspaper: Straight, simple border
      : "p-3 bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] rotate-[-1deg] border border-[#e5e5e5]" // Museum: Photo print style with rotation

    switch (activeMedia) {
      case "video":
        // Show videos if available
        if (eventVideos.length > 0) {
          return (
            <div className="w-full h-full flex flex-col justify-center">
              <div
                className={`relative w-full aspect-video overflow-hidden ${frameClass} ${
                  isMuseum ? "bg-black" : "bg-black"
                }`}
              >
                <video
                  ref={videoRef}
                  key={currentVideoIndex}
                  src={eventVideos[currentVideoIndex]?.src}
                  className="w-full h-full object-cover"
                  playsInline
                  muted={isVideoMuted}
                  volume={videoVolume}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Caption */}
                {eventVideos[currentVideoIndex]?.caption && (
                  <div
                    className={
                      isMaatschappelijk
                        ? "mt-2 text-left w-full px-1"
                        : "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12"
                    }
                  >
                    <p
                      className={
                        isMaatschappelijk
                          ? "text-black font-serif font-bold text-sm uppercase"
                          : "text-white font-medium text-sm md:text-base text-center"
                      }
                    >
                      {isMaatschappelijk && "VIDEO: "}
                      {eventVideos[currentVideoIndex].caption}
                    </p>
                  </div>
                )}
              </div>

              {/* Custom Video Controls */}
              <div className={`mt-4 flex flex-col items-center gap-3`}>
                {/* Play/Pause Button */}
                <button
                  onClick={handleVideoPlayPause}
                  className={`flex items-center justify-center gap-2 px-6 py-2 rounded-md transition-all duration-200 ${
                    isLandbouw
                      ? "bg-[#5e4b35] text-[#f3eeda] hover:bg-[#4a3b2a] shadow-md border border-[#42301e]"
                      : isMaatschappelijk
                      ? "bg-[#5e4b35] text-[#f3eeda] hover:bg-[#4a3b2a] shadow-md border border-[#42301e] font-heading" // Same as Museum style requested by user
                      : "bg-[#5e4b35] text-[#f3eeda] hover:bg-[#4a3b2a] shadow-md border border-[#42301e] font-heading"
                  }`}
                  aria-label={isVideoPlaying ? "Pause" : "Play"}
                >
                  {isVideoPlaying ? (
                    <Pause size={20} className="fill-current" />
                  ) : (
                    <Play size={20} className="fill-current" />
                  )}
                  <span className="text-sm font-medium">
                    {isVideoPlaying ? "STOP" : "PLAY"}
                  </span>
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                  <button
                    onClick={handleMuteToggle}
                    className={`flex-shrink-0 ${
                      isLandbouw
                        ? "text-[#5e4b35] hover:text-[#4a3b2a]"
                        : isMaatschappelijk
                        ? "text-[#5e4b35] hover:text-[#4a3b2a]" // Same as Museum
                        : "text-[#5e4b35] hover:text-[#4a3b2a]"
                    } transition-colors`}
                    aria-label={isVideoMuted ? "Unmute" : "Mute"}
                  >
                    {isVideoMuted || videoVolume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isVideoMuted ? 0 : videoVolume}
                    onChange={handleVolumeChange}
                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                      isLandbouw
                        ? "bg-[#3a2d20]/20 [&::-webkit-slider-thumb]:bg-[#5e4b35] [&::-moz-range-thumb]:bg-[#5e4b35]"
                        : isMaatschappelijk
                        ? "bg-[#3a2d20]/20 [&::-webkit-slider-thumb]:bg-[#5e4b35] [&::-moz-range-thumb]:bg-[#5e4b35]" // Same as Museum
                        : "bg-[#3a2d20]/20 [&::-webkit-slider-thumb]:bg-[#5e4b35] [&::-moz-range-thumb]:bg-[#5e4b35]"
                    } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0`}
                    aria-label="Volume"
                  />
                  <span
                    className={`text-xs flex-shrink-0 min-w-[3rem] text-right ${
                      isLandbouw
                        ? "text-[#5e4b35]"
                        : isMaatschappelijk
                        ? "text-black font-bold"
                        : "text-[#5e4b35]"
                    }`}
                  >
                    {Math.round((isVideoMuted ? 0 : videoVolume) * 100)}%
                  </span>
                </div>
              </div>

              {/* Video Pagination Indicator (Museum & Maatschappelijk) */}
              {(!isLandbouw || isMaatschappelijk) && eventVideos.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-2">
                  {eventVideos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentVideoIndex(idx)
                        if (videoRef.current) {
                          videoRef.current.pause()
                          setIsVideoPlaying(false)
                        }
                      }}
                      className={`transition-all duration-300 ${
                        currentVideoIndex === idx
                          ? isMaatschappelijk
                            ? "w-3 h-3 bg-black rounded-full"
                            : "w-3 h-3 bg-[#5c4033] rounded-full"
                          : isMaatschappelijk
                          ? "w-2 h-2 bg-black/30 rounded-full"
                          : "w-2 h-2 bg-[#8c7b75] rounded-full opacity-50 hover:opacity-75"
                      }`}
                      aria-label={`Go to video ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        }
        // No videos available - show placeholder
        return (
          <div
            className={`w-full aspect-video flex items-center justify-center bg-black ${frameClass}`}
          >
            <div className="text-center space-y-4 p-4">
              <Video
                size={48}
                className="mx-auto text-white/50 animate-pulse lg:w-16 lg:h-16"
              />
              <p className="text-white text-lg font-medium">
                Geen video beschikbaar
              </p>
            </div>
          </div>
        )
      default:
        return (
          <div className="w-full h-full flex flex-col justify-center">
            {/* Main Image Container */}
            <div
              className={`relative w-full aspect-[4/3] overflow-hidden group ${frameClass} ${
                isMuseum ? "bg-gray-100" : "bg-black"
              }`}
            >
              {galleryImages.length > 0 ? (
                <>
                  <motion.div
                    key={currentSlideIndex}
                    className="w-full h-full relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {galleryImages[currentSlideIndex]?.src &&
                    !isVideoFile(galleryImages[currentSlideIndex].src) ? (
                      <img
                        src={galleryImages[currentSlideIndex].src}
                        alt={galleryImages[currentSlideIndex].caption}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-400" />
                      </div>
                    )}

                    {/* Caption - Modified for Museum to be below or overlay */}
                    {galleryImages[currentSlideIndex]?.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                        <p className="text-white font-medium text-sm md:text-base text-center">
                          {galleryImages[currentSlideIndex].caption}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Navigation Arrows (if needed) can be added here */}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3 p-4">
                    <ImageIcon
                      size={64}
                      className={`mx-auto ${
                        isMuseum ? "text-gray-300" : "text-white/20"
                      }`}
                    />
                    <p
                      className={`${
                        isMuseum ? "text-gray-400" : "text-white"
                      } text-xl font-semibold`}
                    >
                      {eventData?.title}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Pagination Indicator (Museum & Maatschappelijk) */}
            {(!isLandbouw || isMaatschappelijk) && galleryImages.length > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`transition-all duration-300 ${
                      currentSlideIndex === idx
                        ? isMaatschappelijk
                          ? "w-3 h-3 bg-black rounded-full"
                          : "w-3 h-3 bg-[#5c4033] rounded-full"
                        : isMaatschappelijk
                        ? "w-2 h-2 bg-black/30 rounded-full"
                        : "w-2 h-2 bg-[#8c7b75] rounded-full opacity-50 hover:opacity-75"
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail Strip (Landbouw only) */}
            {isLandbouw && galleryImages.length > 1 && (
              <div className="h-24 bg-[#f3eeda] p-2 flex gap-2 overflow-x-auto items-center border-t border-[#d1c7a7]">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      currentSlideIndex === idx
                        ? "border-[#7c8f38] scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      {/* Custom Scrollbar Styles based on Theme */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: ${isLandbouw ? "14px" : "10px"};
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isLandbouw ? "#3a2d2010" : "#f7f5eb"};
          border-radius: ${isLandbouw ? "2px" : "0px"};
          ${
            isLandbouw
              ? "box-shadow: inset 0 0 6px rgba(0,0,0,0.1);"
              : "box-shadow: inset 0 0 2px rgba(0,0,0,0.05);"
          }
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: ${isLandbouw ? "#8b5a2b" : "#c9b8a8"};
          background-image: ${
            isLandbouw
              ? "linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.1) 75%, transparent 75%, transparent)"
              : "linear-gradient(to bottom, #d4c4b5 0%, #c9b8a8 50%, #b8a696 100%)"
          };
          border-radius: ${isLandbouw ? "4px" : "5px"};
          border: ${isLandbouw ? "1px solid #5e4b35" : "1px solid #b8a696"};
          box-shadow: ${
            isLandbouw
              ? "none"
              : "inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.1)"
          };
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: ${isLandbouw ? "#6d4520" : "#b8a696"};
        }
      `}</style>

      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playSound()
              onClose()
            }}
          />

          {/* MAIN CARD */}
          <motion.div
            className={`relative w-full max-w-[95vw] xl:max-w-[90vw] h-[90vh] ${theme.bg} rounded-[2px] overflow-hidden flex flex-col`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={
              isMuseum
                ? {
                    boxShadow:
                      "inset 20px 0 40px -10px rgba(0,0,0,0.1), inset -20px 0 40px -10px rgba(0,0,0,0.1), -3px 0 0 #fcfaf5, -6px 0 0 #e3dac6, -9px 0 0 #fcfaf5, -12px 0 0 #e3dac6, -15px 0 0 #fcfaf5, -18px 0 0 #e3dac6, -21px 0 0 #fcfaf5, -24px 0 0 #2e2015, 3px 0 0 #fcfaf5, 6px 0 0 #e3dac6, 9px 0 0 #fcfaf5, 12px 0 0 #e3dac6, 15px 0 0 #fcfaf5, 18px 0 0 #e3dac6, 21px 0 0 #fcfaf5, 24px 0 0 #2e2015, 0 30px 80px rgba(0,0,0,0.6)",
                    marginLeft: "24px", // Offset for the left spine effect
                    marginRight: "24px", // Offset for the right spine effect
                  }
                : isMaatschappelijk
                ? {
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)", // Simple shadow for newspaper
                    // Newspaper typically lays flat or is held, so flat shadow works
                  }
                : {}
            }
          >
            {/* NEWSPAPER HEADER (MAATSCHAPPELIJK ONLY) */}
            {isMaatschappelijk && (
              <div className="w-full pl-8 pr-16 pt-6 pb-4 flex flex-col items-center border-b-4 border-double border-black/20 bg-[#f0f0f0]">
                {/* Dynamic Header Content */}
                <div className="flex justify-between items-center w-full border-b-2 border-black mb-3 pb-2">
                  <span className="font-serif font-bold uppercase tracking-widest text-xs md:text-sm text-black/60">
                    Historisch Nieuwsblad
                  </span>
                  <span className="font-serif font-bold uppercase tracking-widest text-xs md:text-sm text-black/60">
                    {eventData.year}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black uppercase tracking-tighter text-black mb-3 text-center leading-none">
                  {eventData.title}
                </h1>
                <div className="w-full border-t border-black mt-2 mb-2"></div>
                <div className="w-full border-t border-black/50"></div>
              </div>
            )}
            {/* Book Texture Overlay (Subtle Noise) - Museum Only */}
            {isMuseum && (
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
            )}
            {/* Newspaper Texture Overlay - Maatschappelijk Only */}
            {isMaatschappelijk && (
              <div className="absolute inset-0 pointer-events-none opacity-[0.15] bg-[url('https://www.transparenttextures.com/patterns/graphy-dark.png')]" />
            )}
            {/* Book Spine Shadow (Museum Theme) */}
            {isMuseum && (
              <>
                {/* Central Spine Binding Effect - Very subtle and realistic */}
                <div className="absolute inset-y-0 left-1/2 w-4 md:w-6 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent z-20 pointer-events-none hidden md:block mix-blend-multiply" />
              </>
            )}
            {/* Newspaper Divider Line (Maatschappelijk Theme) - REMOVED */}
            <motion.button
              className={`absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isMaatschappelijk
                  ? "bg-transparent hover:bg-black/10 text-black border border-black" // Simple X for Newspaper
                  : theme.closeBtn
              }`}
              onClick={() => {
                playSound()
                onClose()
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>
            {/* CONTENT CONTAINER - Force flex row on desktop */}
            <div
              className={`flex flex-col md:flex-row w-full flex-1 overflow-hidden ${
                isMaatschappelijk ? "pt-0" : ""
              }`}
            >
              {/* LEFT SIDE - MEDIA */}
              <div
                className={`w-full md:w-1/2 h-[300px] md:h-full relative flex-shrink-0 ${
                  isLandbouw
                    ? "bg-[#f3eeda] p-8 flex flex-col justify-center"
                    : isMaatschappelijk
                    ? "bg-transparent p-8 md:p-12 flex flex-col justify-center" // Removed border-r
                    : "bg-transparent p-8 md:p-16 flex items-center justify-center" // Transparent to show book paper
                }`}
              >
                {/* Media Toggle Buttons (Top Left for Landbouw) */}
                {isLandbouw && (
                  <div className="flex justify-center gap-3 mb-6">
                    <motion.button
                      className={`px-6 py-2 rounded-full font-bold font-heading flex items-center gap-2 transition-all text-sm ${
                        activeMedia === "image"
                          ? theme.buttonPrimary
                          : "bg-[#5e4b35] text-[#f3eeda] opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => {
                        playSound()
                        setActiveMedia("image")
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ImageIcon size={18} /> FOTO'S
                    </motion.button>

                    <motion.button
                      className={`px-6 py-2 rounded-full font-bold font-heading flex items-center gap-2 transition-all text-sm ${
                        activeMedia === "video"
                          ? theme.buttonPrimary
                          : "bg-[#5e4b35] text-[#f3eeda] opacity-50 hover:opacity-100"
                      }`}
                      onClick={() => {
                        playSound()
                        setActiveMedia("video")
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Video size={18} /> VIDEO
                    </motion.button>
                  </div>
                )}

                {renderMediaContent()}
              </div>
              {/* RIGHT SIDE - CONTENT WRAPPER */}
              <div
                className={`w-full md:w-1/2 h-full relative overflow-hidden ${theme.bg}`}
              >
                {/* Wheat Background for Landbouw */}
                {isLandbouw && (
                  <div className="absolute bottom-[-10%] -right-[20%] w-[100%] h-[100%] pointer-events-none z-0 opacity-40 rotate-[-10deg] mix-blend-multiply">
                    <motion.img
                      src={landbouwIcon}
                      alt="Landbouw background"
                      className="w-full h-full object-contain object-bottom-right"
                      animate={{
                        rotate: [0, 2, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                )}

                {/* Scrollable Content Layer */}
                <div
                  className={`relative z-10 h-full w-full overflow-y-auto custom-scrollbar flex flex-col ${
                    isMaatschappelijk ? "p-6 md:p-8" : "p-8 md:p-12"
                  }`}
                >
                  {/* Regular Breadcrumb */}
                  {!isLandbouw && (
                    <div className="flex justify-between items-start w-full mb-6 border-b border-black/10 pb-4">
                      <Breadcrumb items={breadcrumbItems} />

                      {/* Newspaper Style Media Buttons (Top Right for Maatschappelijk) */}
                      {isMaatschappelijk && (
                        <div className="flex gap-2 ml-auto">
                          <button
                            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest border border-black transition-all ${
                              activeMedia === "image"
                                ? "bg-black text-white"
                                : "bg-white text-black hover:bg-gray-100"
                            }`}
                            onClick={() => {
                              playSound()
                              setActiveMedia("image")
                            }}
                          >
                            FOTO'S
                          </button>
                          <button
                            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest border border-black transition-all ${
                              activeMedia === "video"
                                ? "bg-black text-white"
                                : "bg-white text-black hover:bg-gray-100"
                            }`}
                            onClick={() => {
                              playSound()
                              setActiveMedia("video")
                            }}
                          >
                            VIDEO
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard Toggle Buttons (Top Right for Museum) */}
                  {!isLandbouw && !isMaatschappelijk && (
                    <div className="mt-4 mb-6 flex justify-end gap-3">
                      <motion.button
                        className={`px-5 py-2.5 rounded-xl font-bold font-heading flex items-center gap-2 transition-all text-sm ${
                          activeMedia === "image"
                            ? theme.buttonPrimary
                            : theme.buttonSecondary
                        }`}
                        onClick={() => {
                          playSound()
                          setActiveMedia("image")
                        }}
                      >
                        <ImageIcon size={18} /> Foto's
                      </motion.button>
                      <motion.button
                        className={`px-5 py-2.5 rounded-xl font-bold font-heading flex items-center gap-2 transition-all text-sm ${
                          activeMedia === "video"
                            ? theme.buttonPrimary
                            : theme.buttonSecondary
                        }`}
                        onClick={() => {
                          playSound()
                          setActiveMedia("video")
                        }}
                      >
                        <Video size={18} /> Video
                      </motion.button>
                    </div>
                  )}

                  <motion.div
                    className={isMaatschappelijk ? "mb-6" : "mb-8 mt-4"}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Year Badge - Styled as Paper Scroll or Badge */}
                    {!isMaatschappelijk && (
                      <div
                        className={`inline-flex items-center mb-6 shadow-sm transition-transform hover:scale-105 ${
                          isLandbouw
                            ? "px-6 py-2 rounded-md border-2 border-[#42301e] bg-[#5c7a4f] rotate-[-2deg] mask-border-rough"
                            : `px-6 py-2 rounded-sm border border-[#d1c7a7] bg-[#e6e0d0] relative before:absolute before:inset-[3px] before:border before:border-[#d1c7a7] before:border-dashed shadow-sm`
                        }`}
                      >
                        <span
                          className={`text-xl font-bold ${
                            isLandbouw ? "text-[#f0e6d2]" : "text-[#5c4033]"
                          } tracking-widest font-heading uppercase`}
                        >
                          {eventData.year}
                        </span>
                      </div>
                    )}

                    {/* Main Title - Only for Museum/Landbouw (Newspaper has it in header) */}
                    {!isMaatschappelijk && (
                      <h1
                        className={`text-4xl lg:text-5xl font-bold mb-6 ${theme.heading} leading-tight tracking-tight font-heading`}
                      >
                        {eventData.title}
                      </h1>
                    )}
                  </motion.div>

                  {/* DESCRIPTION - VITAL PART */}
                  {eventData?.description && (
                    <motion.div
                      className="mb-8"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      {isMaatschappelijk && (
                        /* Drop Cap for Newspaper */
                        <span className="float-left text-6xl font-black font-serif leading-[0.8] mr-3 mt-[-6px] text-black">
                          {eventData.description.charAt(0)}
                        </span>
                      )}
                      <p
                        className={`${theme.text} leading-relaxed text-lg ${
                          isMaatschappelijk ? "text-justify" : ""
                        }`}
                      >
                        {isMaatschappelijk
                          ? eventData.description.substring(1)
                          : eventData.description}
                      </p>
                    </motion.div>
                  )}

                  <motion.div className="space-y-8 flex-grow">
                    {(() => {
                      const historicalContext =
                        eventData?.historicalContext ||
                        eventData?.historical_context ||
                        ""
                      if (!historicalContext || historicalContext.trim() === "")
                        return null
                      return (
                        <div className="mb-8">
                          <div
                            className={`flex items-center gap-2 ${theme.heading} font-bold text-xl mb-4 font-heading border-b ${theme.accentBorder} pb-2`}
                          >
                            <Clock size={24} />
                            <h3>Historische Context</h3>
                          </div>
                          <div
                            className={`${theme.cardBg} rounded-2xl p-6 border ${theme.cardBorder}`}
                          >
                            <p className={`${theme.text} leading-relaxed`}>
                              {historicalContext}
                            </p>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Key Moments */}
                    {(eventData?.has_key_moments || keyMoments.length > 0) && (
                      <div className="mb-8">
                        <div
                          className={`flex items-center gap-2 ${theme.heading} font-bold text-xl mb-4 font-heading border-b ${theme.accentBorder} pb-2`}
                        >
                          <Clock size={24} />
                          <h3>Belangrijke momenten</h3>
                        </div>
                        {keyMoments.length > 0 ? (
                          <MiniTimeline
                            events={keyMoments}
                            activeYear={getActiveYear()}
                            variant={isLandbouw ? "landbouw" : "default"}
                          />
                        ) : (
                          <p className={`text-sm ${theme.textMuted} italic`}>
                            Geen momenten gevonden.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Extra Sections */}
                    {eventSections
                      .filter(section => {
                        // Filter out "Belangrijke momenten" section if key moments are already shown
                        if (
                          (eventData?.has_key_moments ||
                            keyMoments.length > 0) &&
                          section.section_title?.toLowerCase() ===
                            "belangrijke momenten"
                        ) {
                          return false
                        }
                        return true
                      })
                      .map((section, index) => (
                        <div
                          key={index}
                          className={`${theme.cardBg} rounded-2xl p-6 border ${theme.cardBorder} mb-4`}
                        >
                          <h3
                            className={`text-xl font-bold ${theme.heading} mb-2`}
                          >
                            {section.section_title}
                          </h3>
                          <p className={theme.text}>
                            {section.section_content}
                          </p>
                        </div>
                      ))}

                    {/* Game Button */}
                    <div className="mt-8 pt-4">
                      {(eventData?.gameType === "puzzle" ||
                        eventData?.game_type === "puzzle") && (
                        <motion.button
                          className={`w-full py-4 rounded-xl font-bold font-heading flex items-center justify-center gap-3 shadow-lg ${theme.buttonPrimary}`}
                          onClick={handlePuzzleGame}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Puzzle size={24} />{" "}
                          {isLandbouw ? "Bekijk de Ploeg" : "Speel Puzzle"}
                        </motion.button>
                      )}
                      {(eventData?.gameType === "memory" ||
                        eventData?.game_type === "memory") && (
                        <motion.button
                          className={`w-full py-4 rounded-xl font-bold font-heading flex items-center justify-center gap-3 shadow-lg ${theme.buttonPrimary}`}
                          onClick={handleMemoryGame}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Brain size={24} /> Speel Memory
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>{" "}
              {/* End of RIGHT SIDE - CONTENT WRAPPER */}
            </div>{" "}
            {/* End of CONTENT CONTAINER */}
          </motion.div>
        </motion.div>
      )}
      <ImagePuzzleModal
        isOpen={isImagePuzzleModalOpen}
        onClose={handleCloseImagePuzzleModal}
        puzzleImage={puzzleImageUrl}
      />
      <MemoryGame
        isOpen={isMemoryGameModalOpen}
        onClose={handleCloseMemoryGameModal}
        images={
          galleryImages.length > 0
            ? galleryImages.map(img => img.src || img)
            : null
        }
      />
    </AnimatePresence>
  )
}

export default TimelineDetailModal
