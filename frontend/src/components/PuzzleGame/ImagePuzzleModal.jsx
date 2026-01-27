/**
 * ImagePuzzleModal Component
 *
 * A sliding puzzle game implementation including:
 * - Dynamic 3x3 (Easy) and 4x4 (Hard) grids
 * - Global image selection from all available events
 * - Drag/Click mechanics for puzzle solving
 * - Integrated leaderboard and win logic
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw, Trophy, Lightbulb, Zap, Brain, HelpCircle } from "lucide-react"
import {
  splitImageIntoPieces,
  createImagePreview,
} from "../../utils/imageSplitter"
import { getTheme } from "../../config/themes"
import { useSound } from "../../hooks/useSound"
import { api } from "../../services/api"
import VirtualKeyboard from "../Common/VirtualKeyboard"

const ImagePuzzleModal = ({ 
  isOpen, 
  onClose, 
  eventId,
  puzzleImage, 
  galleryImages = [], 
  eventTitle = "",
  variant = "museum" 
}) => {
  const theme = getTheme()
  const { playSound, playSuccess } = useSound()
  const loadedPuzzleImageRef = useRef(null)

  // Theme Styles Configuration
  const getThemeStyles = () => {
    switch (variant) {
      case "landbouw":
        return {
          modalBg: "bg-[#f3eeda] bg-[radial-gradient(circle_at_center,#f2ebd4_0%,#d9ceae_100%)]",
          headerBg: "bg-[#7c8f38]", // Green
          headerText: "text-[#f3eeda]",
          cardBg: "bg-[#e6dfc8]",
          cardBorder: "border-[#d1c7a7]",
          buttonEasy: "bg-[#7c8f38] hover:bg-[#66752e]",
          buttonHard: "bg-[#a0522d] hover:bg-[#8a4220]",
          textPrimary: "text-[#3a2d20]",
          textSecondary: "text-[#6b5a45]",
          accent: "text-[#7c8f38]",
        }
      case "newspaper":
      case "maatschappelijk":
        return {
          modalBg: "bg-[#f0f0f0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]",
          headerBg: "bg-[#1a1a1a]", // Black/Dark Grey
          headerText: "text-[#f0f0f0] font-serif tracking-widest uppercase",
          cardBg: "bg-white border border-black/20",
          cardBorder: "border-black",
          buttonEasy: "bg-[#333] hover:bg-black text-white border border-black uppercase tracking-wider",
          buttonHard: "bg-white hover:bg-gray-100 text-black border-2 border-black uppercase tracking-wider font-bold",
          textPrimary: "text-black font-serif",
          textSecondary: "text-gray-600 font-serif",
          accent: "text-black",
        }
      case "museum":
      default:
        return {
          modalBg: "bg-[#f3f2e9]",
          headerBg: "bg-gradient-to-r from-[#c9a300] to-[#a68600]",
          headerText: "text-white font-heading",
          cardBg: "bg-white",
          cardBorder: "border-[#a7b8b4]/30",
          buttonEasy: "bg-gradient-to-br from-green-500 to-green-600",
          buttonHard: "bg-gradient-to-br from-red-500 to-red-600",
          textPrimary: "text-[#440f0f]",
          textSecondary: "text-[#657575]",
          accent: "text-[#c9a300]",
        }
    }
  }

  const styles = getThemeStyles()

  // Game flow states
  const [gamePhase, setGamePhase] = useState("imageSelect") // imageSelect, difficultySelect, instructions, playing, won
  const [selectedImage, setSelectedImage] = useState(null)
  
  // Grid size based on difficulty
  const [gridSize, setGridSize] = useState(3)
  const TILE_COUNT = gridSize * gridSize - 1
  const MAX_HINTS = 3

  // Difficulty state
  const [difficulty, setDifficulty] = useState(null) // null = selecting, 'easy' or 'hard'
  const [showDifficultySelect, setShowDifficultySelect] = useState(true)

  // Create initial solved state
  const createInitialState = useCallback(() => {
    const tiles = []
    for (let i = 1; i <= TILE_COUNT; i++) {
      tiles.push(i)
    }
    tiles.push(null)
    return tiles
  }, [TILE_COUNT])

  // Get neighbors for a tile
  const getNeighbors = useCallback(index => {
    const neighbors = []
    const row = Math.floor(index / gridSize)
    const col = index % gridSize

    if (row > 0) neighbors.push(index - gridSize)
    if (row < gridSize - 1) neighbors.push(index + gridSize)
    if (col > 0) neighbors.push(index - 1)
    if (col < gridSize - 1) neighbors.push(index + 1)

    return neighbors
  }, [gridSize])

  // Count correct tiles
  const countCorrectTiles = useCallback(tiles => {
    let count = 0
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] === i + 1) count++
    }
    return count
  }, [])

  // Shuffle tiles with difficulty control
  const shuffleTiles = useCallback(
    (tiles, targetDifficulty) => {
      let shuffled = [...tiles]
      let attempts = 0
      const maxAttempts = 1000

      while (attempts < maxAttempts) {
        // Do random shuffles
        const shuffleCount = targetDifficulty === "easy" ? 20 : 50
        shuffled = [...tiles]

        for (let i = 0; i < shuffleCount; i++) {
          const emptyIndex = shuffled.indexOf(null)
          const neighbors = getNeighbors(emptyIndex)
          const randomNeighbor =
            neighbors[Math.floor(Math.random() * neighbors.length)]
          ;[shuffled[emptyIndex], shuffled[randomNeighbor]] = [
            shuffled[randomNeighbor],
            shuffled[emptyIndex],
          ]
        }

        const correctCount = countCorrectTiles(shuffled)

        if (targetDifficulty === "easy") {
          // Easy: exactly 1 or 2 tiles correct
          if (correctCount >= 1 && correctCount <= 2) {
            return shuffled
          }
        } else {
          // Hard: 0 tiles correct
          if (correctCount === 0) {
            return shuffled
          }
        }

        attempts++
      }

      // Fallback: return whatever we have
      return shuffled
    },
    [getNeighbors, countCorrectTiles]
  )

  // Game state
  const [tiles, setTiles] = useState([])
  const [moves, setMoves] = useState(0)
  const [isWon, setIsWon] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [imagePieces, setImagePieces] = useState([])
  const [imagePreview, setImagePreview] = useState(null)

  // Hint state
  const [hintsRemaining, setHintsRemaining] = useState(MAX_HINTS)
  const [highlightedTile, setHighlightedTile] = useState(null)
  
  // Swap Puzzle State (Easy Mode)
  const [selectedSwapTile, setSelectedSwapTile] = useState(null)

  // Leaderboard state
  const [scoresEasy, setScoresEasy] = useState([])
  const [scoresHard, setScoresHard] = useState([])
  const [loadingScores, setLoadingScores] = useState(true)

  // Win/Save state
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [savedRank, setSavedRank] = useState(null)
  
  // Instructions state
  const [showInstructions, setShowInstructions] = useState(false)

  const [globalPuzzleImages, setGlobalPuzzleImages] = useState([])
  
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Check if tile is in correct position
  const isTileCorrect = useCallback((tile, index) => {
    if (tile === null) return false
    return tile === index + 1
  }, [])

  // Check win
  const checkWin = useCallback(
    currentTiles => {
      const correctOrder = createInitialState()
      return currentTiles.every((tile, index) => tile === correctOrder[index])
    },
    [createInitialState]
  )

  // Calculate progress
  const progress = useMemo(() => {
    const correctOrder = createInitialState()
    let correct = 0
    tiles.forEach((tile, index) => {
      if (tile === correctOrder[index] && tile !== null) correct++
    })
    return Math.round((correct / TILE_COUNT) * 100)
  }, [tiles, createInitialState, TILE_COUNT])

  // Find a tile that can be moved to improve the puzzle
  const findHintMove = useCallback(() => {
    const emptyIndex = tiles.indexOf(null)
    const neighbors = getNeighbors(emptyIndex)

    for (const neighborIndex of neighbors) {
      const tile = tiles[neighborIndex]
      if (tile === emptyIndex + 1) {
        return neighborIndex
      }
    }

    for (const neighborIndex of neighbors) {
      const tile = tiles[neighborIndex]
      if (!isTileCorrect(tile, neighborIndex)) {
        return neighborIndex
      }
    }

    return neighbors[0]
  }, [tiles, getNeighbors, isTileCorrect])

  // Use hint
  const useHint = useCallback(() => {
    if (hintsRemaining <= 0 || isWon) return

    const hintTile = findHintMove()
    setHighlightedTile(hintTile)
    setHintsRemaining(prev => prev - 1)

    setTimeout(() => {
      setHighlightedTile(null)
    }, 2000)
  }, [hintsRemaining, isWon, findHintMove])

  // Handle tile click
  const handleTileClick = useCallback(
    clickedIndex => {
      if (isWon) return

      // HARD MODE: Sliding Puzzle (Classic)
      if (difficulty === "hard") {
        const emptyIndex = tiles.indexOf(null)
        const neighbors = getNeighbors(emptyIndex)

        if (neighbors.includes(clickedIndex)) {
          playSound()
          const newTiles = [...tiles]
          ;[newTiles[emptyIndex], newTiles[clickedIndex]] = [
            newTiles[clickedIndex],
            newTiles[emptyIndex],
          ]
          setTiles(newTiles)
          setMoves(prev => prev + 1)
          setHighlightedTile(null)

          if (checkWin(newTiles)) {
            setIsWon(true)
          }
        }
      }
      // EASY MODE: Swap Puzzle (Click & Swap)
      else {
        if (selectedSwapTile === null) {
          // Select first tile to swap
          setSelectedSwapTile(clickedIndex)
          // Optional: Add a subtle sound for selection
        } else {
          // If clicked the same tile, deselect it
          if (selectedSwapTile === clickedIndex) {
            setSelectedSwapTile(null)
            return
          }

          // Swap the two tiles
          playSound()
          const newTiles = [...tiles]
          
          // Swap logic
          const temp = newTiles[clickedIndex]
          newTiles[clickedIndex] = newTiles[selectedSwapTile]
          newTiles[selectedSwapTile] = temp

          setTiles(newTiles)
          setMoves(prev => prev + 1)
          setSelectedSwapTile(null)
          setHighlightedTile(null)

          if (checkWin(newTiles)) {
            setIsWon(true)
          }
        }
      }
    },
    [tiles, isWon, getNeighbors, playSound, checkWin, difficulty, selectedSwapTile]
  )

  // Start game with selected difficulty
  const startGame = useCallback(
    selectedDifficulty => {
      setDifficulty(selectedDifficulty)
      setGridSize(selectedDifficulty === "easy" ? 3 : 4)
      setShowDifficultySelect(false)
      // Show instructions before starting
      setShowInstructions(true)
    },
    []
  )

  // Actually start the game after instructions
  const beginGame = useCallback(() => {
    setShowInstructions(false)
    const initial = createInitialState()
    setTiles(shuffleTiles(initial, difficulty))
    setMoves(0)
    setIsWon(false)
    setHintsRemaining(difficulty === "easy" ? MAX_HINTS : 1) // Less hints for hard
    setHighlightedTile(null)
    setSelectedSwapTile(null)
    setSavedRank(null)
    setSaveError("")
  }, [difficulty, createInitialState, shuffleTiles])

  // Reset game (restart with same difficulty)
  const resetGame = useCallback(() => {
    if (difficulty) {
      const initial = createInitialState()
      setTiles(shuffleTiles(initial, difficulty))
      setMoves(0)
      setIsWon(false)
      setHintsRemaining(difficulty === "easy" ? MAX_HINTS : 1)
      setHighlightedTile(null)
      setSelectedSwapTile(null)
      setSavedRank(null)
      setSaveError("")
    }
  }, [difficulty, createInitialState, shuffleTiles])

  // Go back to difficulty selection
  const changeDifficulty = useCallback(() => {
    setShowDifficultySelect(true)
    setShowInstructions(false)
    setDifficulty(null)
    setIsWon(false)
    setMoves(0)
    setSelectedSwapTile(null)
    setSavedRank(null)
  }, [])

  // Fetch leaderboards
  const fetchScores = useCallback(async () => {
    setLoadingScores(true)
    try {
      const [easyResult, hardResult] = await Promise.all([
        api.getPuzzleScores("easy"),
        api.getPuzzleScores("hard"),
      ])
      if (easyResult.success) setScoresEasy(easyResult.scores || [])
      if (hardResult.success) setScoresHard(hardResult.scores || [])
    } catch (error) {
      console.error("Failed to fetch scores:", error)
    } finally {
      setLoadingScores(false)
    }
  }, [])

  // Save score
  const handleSaveScore = useCallback(
    async playerName => {
      setSaveError("")
      try {
        const result = await api.savePuzzleScore(playerName, moves, difficulty)
        if (result.success) {
          setSavedRank(result.rank)
          // Refresh scores
          fetchScores()
          setShowKeyboard(false)
        } else {
          setSaveError(result.message || "Kon score niet opslaan")
        }
      } catch (error) {
        setSaveError("Kon score niet opslaan. Probeer opnieuw.")
      }
    },
    [moves, difficulty, fetchScores]
  )

  // Get background position for tile
  const getBackgroundPosition = useCallback(pieceNumber => {
    if (pieceNumber === null) return "0 0"
    const index = pieceNumber - 1
    const row = Math.floor(index / gridSize)
    const col = index % gridSize
    // Calculate percentage based on grid - for 3x3 use 50%, for 4x4 use 33.33%
    const step = gridSize === 3 ? 50 : 33.33
    return `${col * step}% ${row * step}%`
  }, [gridSize])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      // Also prevent touch scrolling on touch devices
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
    } else {
      document.body.style.overflow = "unset"
      document.body.style.position = "unset"
      document.body.style.width = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
      document.body.style.position = "unset"
      document.body.style.width = "unset"
    }
  }, [isOpen])

  // Load global puzzle images when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchGlobalPuzzles = async () => {
        const result = await api.getPuzzleImages(eventId)
        if (result.success) {
          setGlobalPuzzleImages(result.puzzleImages || [])
        }
      }
      fetchGlobalPuzzles()
    }
  }, [isOpen, eventId])

  // Load image when selected image changes
  useEffect(() => {
    // If selectedImage is an object (from global list), use its imageUrl
    // Otherwise use it directly (string)
    const imageToLoad = selectedImage?.imageUrl || selectedImage || puzzleImage
    
    if (isOpen && imageToLoad && loadedPuzzleImageRef.current !== imageToLoad) {
      fetchScores()
      setLoadError(null)

      const loadImage = async () => {
        try {
          setIsLoading(true)
          const pieces = await splitImageIntoPieces(imageToLoad, gridSize)
          setImagePieces(pieces)
          const preview = await createImagePreview(imageToLoad)
          setImagePreview(preview)
          loadedPuzzleImageRef.current = imageToLoad
        } catch (error) {
          console.error("Error loading puzzle image:", error)
          setLoadError({ message: error.message, url: imageToLoad })
          setImagePieces([])
          loadedPuzzleImageRef.current = imageToLoad
        } finally {
          setIsLoading(false)
        }
      }
      loadImage()
    }
  }, [isOpen, selectedImage, puzzleImage, gridSize, fetchScores])

  // Reset when modal closes and Initialize when opens
  useEffect(() => {
    if (!isOpen) {
      loadedPuzzleImageRef.current = null
      setIsWon(false)
      setMoves(0)
      setLoadError(null)
      setSavedRank(null)
      setSaveError("")
      setShowKeyboard(false)
      setHintsRemaining(MAX_HINTS)
      setHighlightedTile(null)
      setSelectedSwapTile(null)
      setShowDifficultySelect(true)
      setShowInstructions(false)
      setDifficulty(null)
      // Do NOT reset selectedImage here effectively, as we want to remember it
      // But for clean state on close:
      setGamePhase("imageSelect")
      setSelectedImage(null)
      setGridSize(3)
    } else {
        // Initialization when opening
        if (puzzleImage) {
            setSelectedImage(puzzleImage)
            setGamePhase("difficultySelect")
        } else {
            setGamePhase("imageSelect")
            setSelectedImage(null)
        }
    }
  }, [isOpen, puzzleImage])

  // Get current scores based on difficulty
  const currentScores = difficulty === "easy" ? scoresEasy : scoresHard

  // Allow modal to open if we have puzzle image OR gallery images
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={`relative ${styles.modalBg} rounded-xl shadow-2xl w-[98vw] max-w-7xl max-h-[98vh] flex flex-col overflow-hidden border-4 ${
              variant === "newspaper" ? "border-black" : "border-transparent"
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-5 ${styles.headerBg}`}>
              <div className="flex items-center gap-4">
                <h2 className={`text-2xl lg:text-3xl font-bold ${styles.headerText}`}>
                  {variant === "newspaper" ? "FOTO PUZZEL" : "Foto Schuifpuzzel"}
                </h2>
                {difficulty && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      variant === "newspaper"
                        ? "bg-white text-black border border-black uppercase tracking-wider"
                        : difficulty === "easy"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {difficulty === "easy" ? "Makkelijk" : "Moeilijk"}
                  </span>
                )}
              </div>

                <div className="flex items-center gap-3">
                {!showDifficultySelect && !showInstructions && (
                  <>
                    <div className={`${styles.headerText} text-lg font-bold`}>
                      Zetten:{" "}
                      <span
                        className={
                          variant === "newspaper" ? "text-white underline" : "text-yellow-200"
                        }
                      >
                        {moves}
                      </span>
                    </div>

                    {/* Hint Button */}
                    <motion.button
                      className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${
                        hintsRemaining > 0 && !isWon
                          ? "bg-white/20 hover:bg-white/30 text-white animate-pulse"
                          : "bg-white/10 text-white/50 cursor-not-allowed"
                      }`}
                      onClick={useHint}
                      disabled={hintsRemaining <= 0 || isWon}
                      whileHover={hintsRemaining > 0 ? { scale: 1.05 } : {}}
                      whileTap={hintsRemaining > 0 ? { scale: 0.95 } : {}}
                    >
                      <Lightbulb size={20} />
                      <span>{hintsRemaining}</span>
                    </motion.button>

                    {/* Help Button */}
                    <motion.button
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                      onClick={() => setShowInstructions(true)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Help"
                    >
                      <HelpCircle size={24} />
                    </motion.button>

                    {/* Change Difficulty Button */}
                    <motion.button
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors font-medium text-sm"
                      onClick={changeDifficulty}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Terug
                    </motion.button>

                    <motion.button
                      className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                      onClick={resetGame}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RotateCcw size={24} />
                    </motion.button>
                  </>
                )}

                <motion.button
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={28} />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 lg:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div
                    className={`animate-spin w-16 h-16 border-4 ${
                      variant === "newspaper" ? "border-black" : "border-[#c9a300]"
                    } border-t-transparent rounded-full`}
                  />
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <p className="text-red-500 text-xl">
                    Kon afbeelding niet laden
                  </p>
                  <p className="text-gray-500 text-sm">{loadError.message}</p>
                  <button
                    onClick={onClose}
                    className={`px-6 py-3 ${
                      variant === "newspaper" ? "bg-black text-white" : "bg-[#c9a300] text-white"
                    } rounded-xl font-bold`}
                  >
                    Sluiten
                  </button>
                </div>
              ) : gamePhase === "imageSelect" ? (
                /* Image Selection Screen */
                <div className="flex flex-col items-center justify-center h-full gap-8 py-8 px-4">
                  <div className="text-center">
                    <h3
                      className={`text-3xl lg:text-4xl font-bold mb-3 ${styles.textPrimary} ${
                        variant === "newspaper" ? "font-serif uppercase tracking-widest" : "font-heading"
                      }`}
                    >
                      {variant === "newspaper" ? "KIES EEN FOTO" : "Kies een foto"}
                    </h3>
                    <p className={`text-lg ${styles.textSecondary}`}>
                      Welke afbeelding wil je als puzzel?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl w-full overflow-auto max-h-[60vh] p-2">
                    {/* Include main puzzle image if available */}
                    {puzzleImage && (
                      <motion.button
                        key="main-puzzle"
                        className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                          selectedImage === puzzleImage 
                            ? "border-[#7c8f38] scale-105 shadow-xl" 
                            : "border-transparent hover:border-white/50 shadow-lg"
                        }`}
                        onClick={() => {
                          playSound()
                          setSelectedImage(puzzleImage)
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img 
                          src={puzzleImage} 
                          alt="Hoofdafbeelding" 
                          className="w-full h-full object-cover"
                        />
                        {selectedImage === puzzleImage && (
                          <div className="absolute inset-0 bg-[#7c8f38]/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                              <svg className="w-8 h-8 text-[#7c8f38]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </motion.button>
                    )}
                    
                    {/* Gallery images */}
                    {globalPuzzleImages.map((item, idx) => (
                      <motion.button
                        key={`global-${item.id}`}
                        className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                          selectedImage === item 
                            ? "border-[#7c8f38] scale-105 shadow-xl" 
                            : "border-transparent hover:border-white/50 shadow-lg"
                        }`}
                        onClick={() => {
                          playSound()
                          setSelectedImage(item)
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                         <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                            {item.title}
                         </div>
                        {selectedImage === item && (
                          <div className="absolute inset-0 bg-[#7c8f38]/20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-2">
                              <svg className="w-8 h-8 text-[#7c8f38]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Continue button */}
                  <motion.button
                    className={`px-10 py-4 rounded-2xl font-bold text-xl shadow-lg transition-all ${
                      selectedImage 
                        ? "bg-[#7c8f38] text-white hover:bg-[#66752e]" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (selectedImage) {
                        playSound()
                        setGamePhase("difficultySelect")
                      }
                    }}
                    disabled={!selectedImage}
                    whileHover={selectedImage ? { scale: 1.05 } : {}}
                    whileTap={selectedImage ? { scale: 0.95 } : {}}
                  >
                    Ga verder
                  </motion.button>
                </div>
              ) : showDifficultySelect ? (
                /* Difficulty Selection Screen - Dynamic Style */
                <div className="flex flex-col items-center justify-center h-full gap-12 py-8">
                  <div className="text-center">
                    <h3
                      className={`text-3xl lg:text-5xl font-bold mb-3 ${styles.textPrimary} ${
                        variant === "newspaper" ? "font-serif uppercase tracking-widest" : "font-heading"
                      }`}
                    >
                      {variant === "newspaper" ? "KIES NIVEAU" : "Kies je niveau"}
                    </h3>
                    <p className={`text-lg ${styles.textSecondary}`}>
                      {variant === "newspaper"
                        ? "Selecteer de moeilijkheidsgraad"
                        : "Hoe moeilijk wil je het maken?"}
                    </p>
                  </div>

                  <div className="flex gap-8 lg:gap-12">
                    {/* Easy Button */}
                    <motion.button
                      className={`relative flex flex-col items-center justify-center gap-5 w-56 h-72 lg:w-72 lg:h-80 rounded-2xl shadow-2xl transition-all overflow-hidden ${
                        variant === "newspaper"
                          ? "bg-[#1a1a1a] border-4 border-black"
                          : variant === "landbouw"
                          ? "bg-gradient-to-br from-[#7c8f38] via-[#6a7d2e] to-[#5a6d24] border-4 border-[#4a5d1a]"
                          : "bg-gradient-to-br from-[#5c9a4d] via-[#4a8a3d] to-[#3a7a2d] border-4 border-[#2a6a1d]"
                      }`}
                      onClick={() => startGame("easy")}
                      whileHover={{ scale: 1.05, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Decorative Pattern */}
                      {variant !== "newspaper" && (
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyMCA0ME0wIDIwTDQwIDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]" />
                      )}
                      
                      {/* Icon */}
                      <div
                        className={`p-5 rounded-full ${
                          variant === "newspaper"
                            ? "bg-white text-black"
                            : "bg-white/25 text-white backdrop-blur-sm"
                        }`}
                      >
                        <Zap size={56} strokeWidth={2} />
                      </div>
                      
                      {/* Text */}
                      <div className="text-center px-4 relative z-10">
                        <span
                          className={`text-2xl lg:text-3xl font-bold block ${
                            variant === "newspaper" ? "text-white font-serif uppercase tracking-wider" : "text-white"
                          }`}
                        >
                          {variant === "newspaper" ? "MAKKELIJK" : "Makkelijk"}
                        </span>
                        <span
                          className={`text-sm lg:text-base opacity-90 block mt-2 ${
                            variant === "newspaper" ? "text-gray-400 uppercase tracking-wide" : "text-white/80"
                          }`}
                        >
                          Voor beginners
                        </span>
                        <span
                          className={`text-xs opacity-70 block mt-1 ${
                            variant === "newspaper" ? "text-gray-500" : "text-white/60"
                          }`}
                        >
                          3 hints beschikbaar
                        </span>
                      </div>
                    </motion.button>

                    {/* Hard Button */}
                    <motion.button
                      className={`relative flex flex-col items-center justify-center gap-5 w-56 h-72 lg:w-72 lg:h-80 rounded-2xl shadow-2xl transition-all overflow-hidden ${
                        variant === "newspaper"
                          ? "bg-white border-4 border-black"
                          : variant === "landbouw"
                          ? "bg-gradient-to-br from-[#8b5a2b] via-[#7a4a1b] to-[#6a3a0b] border-4 border-[#5a2a00]"
                          : "bg-gradient-to-br from-[#c9514d] via-[#b9413d] to-[#a9312d] border-4 border-[#99211d]"
                      }`}
                      onClick={() => startGame("hard")}
                      whileHover={{ scale: 1.05, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Decorative Pattern */}
                      {variant !== "newspaper" && (
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyMCA0ME0wIDIwTDQwIDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]" />
                      )}
                      
                      {/* Icon */}
                      <div
                        className={`p-5 rounded-full ${
                          variant === "newspaper"
                            ? "bg-black text-white"
                            : "bg-white/25 text-white backdrop-blur-sm"
                        }`}
                      >
                        <Brain size={56} strokeWidth={2} />
                      </div>
                      
                      {/* Text */}
                      <div className="text-center px-4 relative z-10">
                        <span
                          className={`text-2xl lg:text-3xl font-bold block ${
                            variant === "newspaper" ? "text-black font-serif uppercase tracking-wider" : "text-white"
                          }`}
                        >
                          {variant === "newspaper" ? "MOEILIJK" : "Moeilijk"}
                        </span>
                        <span
                          className={`text-sm lg:text-base opacity-90 block mt-2 ${
                            variant === "newspaper" ? "text-gray-700 uppercase tracking-wide" : "text-white/80"
                          }`}
                        >
                          Voor experts
                        </span>
                        <span
                          className={`text-xs opacity-70 block mt-1 ${
                            variant === "newspaper" ? "text-gray-500" : "text-white/60"
                          }`}
                        >
                          1 hint beschikbaar
                        </span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              ) : showInstructions ? (
                /* Instructions Screen */
                <div className="flex flex-col items-center justify-center h-full gap-8 p-4 lg:p-8 text-center max-w-3xl mx-auto">
                  <h3 className={`text-3xl lg:text-4xl font-bold ${styles.textPrimary}`}>
                    Hoe werkt het?
                  </h3>
                  
                  <div className="bg-white/50 p-6 rounded-2xl backdrop-blur-sm border border-white/20 shadow-sm">
                    {difficulty === "easy" ? (
                      <div className="space-y-4">
                        <p className={`text-xl ${styles.textSecondary}`}>
                          1. Tik op een puzzelstukje om het te selecteren.
                        </p>
                        <p className={`text-xl ${styles.textSecondary}`}>
                          2. Tik op een ander stukje om ze van <span className="font-bold text-green-600">plaats te wisselen</span>.
                        </p>
                        <p className={`text-xl ${styles.textSecondary}`}>
                          3. Maak de afbeelding compleet!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className={`text-xl ${styles.textSecondary}`}>
                          1. Tik op een puzzelstukje naast het lege vak.
                        </p>
                        <p className={`text-xl ${styles.textSecondary}`}>
                          2. Schuif de stukjes totdat de afbeelding compleet is.
                        </p>
                        <p className={`text-xl ${styles.textSecondary}`}>
                          3. Dit is een klassieke schuifpuzzel!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 bg-yellow-100 p-4 rounded-xl border-2 border-yellow-300">
                    <Lightbulb size={32} className="text-yellow-600" />
                    <div className="text-left">
                      <p className="font-bold text-yellow-800">Heb je hulp nodig?</p>
                      <p className="text-yellow-700 text-sm">
                        Je hebt <span className="font-bold text-lg">{difficulty === "easy" ? 3 : 1}</span> hints beschikbaar! Gebruik ze verstandig.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    className={`px-12 py-4 rounded-2xl font-bold text-xl shadow-lg mt-4 ${
                      difficulty === "easy" ? styles.buttonEasy : styles.buttonHard
                    }`}
                    onClick={() => {
                        // If game already started (has moves), just close instructions. 
                        // Otherwise start new game.
                        if (moves > 0) {
                            setShowInstructions(false)
                        } else {
                            beginGame()
                        }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {moves > 0 ? "Verder Spelen" : "Start Spel"}
                  </motion.button>
                </div>
              ) : showLeaderboard ? (
                /* Leaderboard View (Full Screen) */
                <div className="flex flex-col items-center justify-center h-full p-6 w-full">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-[#a7b8b4]/30 flex flex-col h-full max-h-[600px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-[#440f0f] flex items-center gap-3">
                          <Trophy size={32} className="text-[#c9a300]" />
                          Beste Scores ({difficulty === "easy" ? "Makkelijk" : "Moeilijk"})
                        </h3>
                        <button 
                            onClick={() => setShowLeaderboard(false)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={24} className="text-gray-500" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {loadingScores ? (
                          <div className="text-center py-12 text-[#657575] text-lg">
                            Scores laden...
                          </div>
                        ) : currentScores.length === 0 ? (
                          <div className="text-center py-12 text-[#657575] text-lg">
                            Nog geen scores voor dit niveau.
                          </div>
                        ) : (
                          currentScores.slice(0, 50).map((score, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-4 rounded-xl transition-transform hover:scale-[1.01] ${
                                index === 0
                                  ? "bg-yellow-50 border-2 border-yellow-200 shadow-sm"
                                  : index === 1
                                  ? "bg-gray-50 border-2 border-gray-200 shadow-sm"
                                  : index === 2
                                  ? "bg-orange-50 border-2 border-orange-200 shadow-sm"
                                  : index % 2 === 0 ? "bg-gray-50" : "bg-white"
                              } ${score.rank === savedRank ? "ring-2 ring-green-500 bg-green-50" : ""}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${
                                    index === 0 ? "bg-yellow-100 text-yellow-600" :
                                    index === 1 ? "bg-gray-200 text-gray-600" :
                                    index === 2 ? "bg-orange-100 text-orange-600" :
                                    "bg-gray-100 text-gray-500"
                                }`}>
                                    {index + 1}
                                </div>
                                <span className="font-bold text-lg text-[#440f0f]">
                                  {score.player_name}
                                </span>
                              </div>
                              <span className={`font-bold text-lg ${
                                  index < 3 ? "text-[#c9a300]" : "text-[#657575]"
                              }`}>
                                {score.moves} zetten
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center gap-4">
                        <motion.button
                            className="px-8 py-3 bg-gradient-to-r from-[#c9a300] to-[#a68600] text-white rounded-xl font-bold shadow-lg"
                            onClick={() => {
                                setShowLeaderboard(false);
                                resetGame();
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Nieuw Spel
                        </motion.button>
                        <motion.button
                            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                            onClick={() => {
                                setShowLeaderboard(false);
                                changeDifficulty();
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Ander Niveau
                        </motion.button>
                      </div>
                    </div>
                </div>
              ) : isWon ? (
                /* Win Screen */
                <motion.div
                  className="flex flex-col items-center justify-center h-full gap-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Trophy size={120} className="text-[#c9a300]" />
                  </motion.div>
                  <h3 className="text-4xl lg:text-5xl font-bold text-[#440f0f]">
                    Gefeliciteerd!
                  </h3>
                  <p className="text-xl lg:text-2xl text-[#657575]">
                    Je hebt de puzzel opgelost in{" "}
                    <span className="font-bold text-[#c9a300]">{moves}</span>{" "}
                    zetten!
                  </p>
                  <p className="text-lg text-[#657575]">
                    Niveau:{" "}
                    <span
                      className={`font-bold ${
                        difficulty === "easy"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {difficulty === "easy" ? "Makkelijk" : "Moeilijk"}
                    </span>
                  </p>
                  
                  {savedRank ? (
                    <div className="text-center w-full flex flex-col items-center">
                      <p className="text-2xl text-green-600 font-bold mb-6 animate-bounce">
                        🎉 Je staat op plaats #{savedRank}!
                      </p>
                      
                      <div className="flex gap-4">
                        <motion.button
                          className="px-6 py-3 bg-gradient-to-r from-[#c9a300] to-[#a68600] text-white rounded-2xl font-bold shadow-lg"
                          onClick={resetGame}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Opnieuw
                        </motion.button>
                        
                        <motion.button
                          className="px-6 py-3 bg-white border-2 border-[#c9a300] text-[#c9a300] rounded-2xl font-bold shadow-lg flex items-center gap-2"
                          onClick={() => {
                            setShowLeaderboard(true);
                            // Refresh scores to ensure new score is visible
                            fetchScores();
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trophy size={20} />
                          Bekijk Scores
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <motion.button
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-lg shadow-lg"
                        onClick={() => setShowKeyboard(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Score Opslaan
                      </motion.button>
                      {saveError && <p className="text-red-500">{saveError}</p>}
                    </div>
                  )}

                  {!savedRank && (
                    <div className="flex gap-4 mt-4">
                        <motion.button
                        className="px-6 py-3 bg-gradient-to-r from-[#c9a300] to-[#a68600] text-white rounded-2xl font-bold shadow-lg"
                        onClick={resetGame}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        >
                        Opnieuw
                        </motion.button>
                        <motion.button
                        className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl font-bold shadow-lg"
                        onClick={changeDifficulty}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        >
                        Terug
                        </motion.button>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Game Board */
                <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
                  {/* Preview - always visible */}
                  {imagePreview && (
                    <div className="flex-shrink-0 flex flex-col gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-[#c9a300]">
                        <img
                          src={imagePreview}
                          alt="Origineel"
                          className="w-64 h-64 lg:w-72 lg:h-72 object-contain rounded-xl bg-gray-50"
                        />
                        <p className="text-center text-sm text-[#657575] mt-2 font-bold uppercase tracking-wide">
                          Origineel
                        </p>
                      </div>

                      <button
                        onClick={() => {
                            setGamePhase("imageSelect")
                            setSavedRank(null)
                            setIsWon(false)
                            setMoves(0)
                        }}
                        className="px-4 py-2 bg-white border-2 border-[#c9a300] text-[#c9a300] rounded-xl font-bold hover:bg-[#fff9e6] transition-colors shadow-sm"
                      >
                        Andere foto's
                      </button>

                      {/* Always visible instruction card */}
                      <div className="bg-[#fff9e6] p-4 rounded-xl border border-[#ffe082] max-w-[300px]">
                        <h4 className="font-bold text-[#b45309] mb-2 flex items-center gap-2">
                          <Lightbulb size={18} />
                          Hoe te spelen:
                        </h4>
                        <p className="text-sm text-[#8c6b1f] leading-relaxed">
                          {difficulty === "easy" 
                            ? "Tik op twee stukjes om ze van plaats te wisselen en de puzzel op te lossen."
                            : "Schuif de stukjes naar de lege plek om de afbeelding compleet te maken."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Puzzle Grid */}
                  <div 
                    className={`grid gap-3 p-5 bg-[#440f0f]/10 rounded-2xl`}
                    style={{ 
                        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` 
                    }}
                  >
                    {tiles.map((tile, index) => {
                      const isCorrect = isTileCorrect(tile, index)
                      const isHighlighted = highlightedTile === index
                      const isSelected = selectedSwapTile === index

                      return (
                        <motion.div
                          key={index}
                          className={`rounded-xl cursor-pointer overflow-hidden relative ${
                            gridSize === 4 ? "w-24 h-24 lg:w-28 lg:h-28" : "w-32 h-32 lg:w-40 lg:h-40"
                          } ${
                            tile === null
                              ? "bg-[#440f0f]/20 border-3 border-dashed border-[#440f0f]/30"
                              : isSelected
                              ? "shadow-2xl border-4 border-blue-500 ring-4 ring-blue-300/50 scale-105 z-10"
                              : isHighlighted
                              ? "shadow-xl border-4 border-yellow-400 ring-4 ring-yellow-300/50"
                              : isCorrect
                              ? "shadow-lg border-4 border-green-500"
                              : "shadow-lg border-3 border-white hover:border-[#c9a300]"
                          }`}
                          onClick={() => handleTileClick(index)}
                          whileHover={tile !== null ? { scale: 1.02 } : {}}
                          whileTap={tile !== null ? { scale: 0.98 } : {}}
                          layout
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        >
                          {tile !== null && (
                            <>
                              {imagePieces.length > 0 &&
                              imagePieces[tile - 1] ? (
                                <img
                                  src={imagePieces[tile - 1]}
                                  alt={`Piece ${tile}`}
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                              ) : (
                                <div
                                  className="w-full h-full bg-cover bg-no-repeat"
                                  style={{
                                    backgroundImage: `url(${puzzleImage})`,
                                    backgroundPosition:
                                      getBackgroundPosition(tile),
                                    backgroundSize: "300%",
                                  }}
                                />
                              )}
                              {isCorrect && (
                                <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Leaderboard */}
                  <div className="flex-shrink-0 w-72">
                    <div className="bg-white rounded-2xl shadow-lg p-5 border border-[#a7b8b4]/30">
                      <h3 className="text-lg font-bold text-[#440f0f] mb-4 flex items-center gap-2">
                        <Trophy
                          size={20}
                          className={
                            difficulty === "easy"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        />
                        Beste Scores (
                        {difficulty === "easy" ? "Makkelijk" : "Moeilijk"})
                      </h3>

                      {loadingScores ? (
                        <div className="text-center py-4 text-[#657575]">
                          Laden...
                        </div>
                      ) : currentScores.length === 0 ? (
                        <div className="text-center py-4 text-[#657575]">
                          Nog geen scores
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {currentScores.slice(0, 5).map((score, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2.5 rounded-lg ${
                                index === 0
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : index === 1
                                  ? "bg-gray-50 border border-gray-200"
                                  : index === 2
                                  ? "bg-orange-50 border border-orange-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-base font-bold ${
                                    index === 0
                                      ? "text-yellow-500"
                                      : index === 1
                                      ? "text-gray-400"
                                      : index === 2
                                      ? "text-orange-400"
                                      : "text-[#657575]"
                                  }`}
                                >
                                  {index === 0
                                    ? "🥇"
                                    : index === 1
                                    ? "🥈"
                                    : index === 2
                                    ? "🥉"
                                    : `${index + 1}.`}
                                </span>
                                <span className="font-medium text-[#440f0f] text-sm">
                                  {score.player_name}
                                </span>
                              </div>
                              <span
                                className={`font-bold text-sm ${
                                  index === 0
                                    ? "text-yellow-600"
                                    : index === 1
                                    ? "text-gray-500"
                                    : index === 2
                                    ? "text-orange-500"
                                    : "text-[#657575]"
                                }`}
                              >
                                {score.moves}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Progress */}
                      <div className="mt-4 pt-4 border-t border-[#a7b8b4]/30">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[#657575]">Voortgang:</span>
                          <span className="font-bold text-[#c9a300]">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#c9a300] to-[#a68600] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="flex justify-between text-sm mt-3">
                          <span className="text-[#657575]">Jouw score:</span>
                          <span className="font-bold text-[#c9a300]">
                            {moves} zetten
                          </span>
                        </div>
                      </div>

                      {/* Change difficulty button */}
                      <motion.button
                        className="w-full mt-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-[#657575] transition-colors"
                        onClick={changeDifficulty}
                        whileTap={{ scale: 0.98 }}
                      >
                        Ander niveau kiezen
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Virtual Keyboard */}
          <VirtualKeyboard
            isOpen={showKeyboard}
            onClose={() => setShowKeyboard(false)}
            onSubmit={handleSaveScore}
            maxLength={10}
            title="Voer je naam in"
            placeholder="Bijv. Emma"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ImagePuzzleModal
