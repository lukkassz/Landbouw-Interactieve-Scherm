/**
 * HarvestGame Component (Oogst Tijd)
 *
 * A fun, fast-paced catching game where players collect
 * agricultural items while avoiding unwanted objects.
 * Perfect for touch screens and museum kiosks.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw, Trophy, Play, Pause } from "lucide-react"
import { getTheme } from "../../config/themes"
import { useSound } from "../../hooks/useSound"

// Game objects - good items to catch
const GOOD_ITEMS = {
  landbouw: ["🌾", "🌽", "🥔", "🥕", "🍅", "🥬", "🥛", "🥚", "🚜", "🧺"],
  museum: ["📜", "🏛️", "🕰️", "📚", "🖼️", "🔍", "📖", "⚱️"],
  maatschappelijk: ["📰", "✍️", "📸", "📻", "🚂", "🏭", "👥", "🌍"],
}

// Bad items to avoid
const BAD_ITEMS = ["🗿", "💣", "☠️", "❌", "🚫", "⛔"]

// Game difficulty levels
const DIFFICULTY_LEVELS = {
  easy: { spawnRate: 1200, fallSpeed: 2, goodItemRatio: 0.8 },
  medium: { spawnRate: 800, fallSpeed: 3, goodItemRatio: 0.7 },
  hard: { spawnRate: 500, fallSpeed: 4, goodItemRatio: 0.6 },
}

const HarvestGame = ({ isOpen, onClose, variant = "museum" }) => {
  const theme = getTheme()
  const playSound = useSound()

  // Game state
  const [gameState, setGameState] = useState("menu") // menu, playing, paused, gameOver
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds per round
  const [difficulty, setDifficulty] = useState("medium")
  const [fallingItems, setFallingItems] = useState([])
  const [basketPosition, setBasketPosition] = useState(50) // percentage from left

  // Refs
  const gameAreaRef = useRef(null)
  const animationFrameRef = useRef(null)
  const spawnTimerRef = useRef(null)
  const gameTimerRef = useRef(null)
  const touchStartX = useRef(null)

  // Theme styles
  const styles = useMemo(() => {
    switch (variant) {
      case "landbouw":
        return {
          modalBg:
            "bg-[#f3eeda] bg-[radial-gradient(circle_at_center,#f2ebd4_0%,#d9ceae_100%)]",
          headerBg: "bg-[#7c8f38]",
          headerText: "text-[#f3eeda]",
          textPrimary: "text-[#3a2d20]",
          textSecondary: "text-[#6b5a45]",
          buttonPrimary:
            "bg-gradient-to-br from-[#7c8f38] via-[#6a7d2e] to-[#5a6d24] border-2 border-[#4a5d1a] text-white",
          basketColor: "from-[#7c8f38] to-[#5a6d24]",
        }
      case "newspaper":
      case "maatschappelijk":
        return {
          modalBg:
            "bg-[#f0f0f0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]",
          headerBg: "bg-[#1a1a1a]",
          headerText: "text-[#f0f0f0] font-serif tracking-widest uppercase",
          textPrimary: "text-black font-serif",
          textSecondary: "text-gray-600 font-serif",
          buttonPrimary: "bg-[#1a1a1a] border-2 border-black text-white",
          basketColor: "from-gray-800 to-black",
        }
      case "museum":
      default:
        return {
          modalBg: "bg-[#f3f2e9]",
          headerBg: "bg-gradient-to-r from-[#c9a300] to-[#a68600]",
          headerText: "text-white font-heading",
          textPrimary: "text-[#440f0f]",
          textSecondary: "text-[#657575]",
          buttonPrimary:
            "bg-gradient-to-br from-[#c9a300] via-[#b89300] to-[#a68600] border-2 border-[#8a6d00] text-white",
          basketColor: "from-[#c9a300] to-[#a68600]",
        }
    }
  }, [variant])

  // Get items for current variant
  const availableGoodItems = useMemo(() => {
    const variantKey = variant === "newspaper" ? "maatschappelijk" : variant
    return GOOD_ITEMS[variantKey] || GOOD_ITEMS.museum
  }, [variant])

  // Generate random item
  const generateItem = useCallback(() => {
    const isGood = Math.random() < DIFFICULTY_LEVELS[difficulty].goodItemRatio
    const items = isGood ? availableGoodItems : BAD_ITEMS
    const item = items[Math.floor(Math.random() * items.length)]
    const x = Math.random() * 80 + 10 // 10-90% of screen width

    const newItem = {
      id: Date.now() + Math.random(),
      emoji: item,
      x: x,
      y: -5, // Start above screen (negative percentage)
      isGood,
      speed: DIFFICULTY_LEVELS[difficulty].fallSpeed,
    }
    
    return newItem
  }, [difficulty, availableGoodItems])

  // Spawn new items
  const spawnItem = useCallback(() => {
    setFallingItems(prev => {
      // Only spawn if we have less than 20 items on screen (performance)
      if (prev.length < 20) {
        const newItem = generateItem()
        console.log("Spawning item:", newItem)
        return [...prev, newItem]
      }
      return prev
    })
  }, [generateItem])

  // Update falling items
  const updateGame = useCallback(() => {
    setFallingItems(prev => {
      if (prev.length === 0) return prev
      
      const updated = prev.map(item => {
        const newY = item.y + item.speed
        
        // Check if item reached bottom
        if (newY > 85) {
          // Check collision with basket
          const basketLeft = basketPosition - 5
          const basketRight = basketPosition + 5

          if (item.x >= basketLeft && item.x <= basketRight) {
            // Collision!
            if (item.isGood) {
              setScore(prev => prev + 10)
              playSound()
            } else {
              setLives(prev => {
                const newLives = prev - 1
                if (newLives <= 0) {
                  setTimeout(() => setGameState("gameOver"), 0)
                }
                return newLives
              })
            }
          } else if (item.isGood) {
            // Missed a good item - lose a life
            setLives(prev => {
              const newLives = prev - 1
              if (newLives <= 0) {
                setTimeout(() => setGameState("gameOver"), 0)
              }
              return newLives
            })
          }
          return null // Mark for removal
        }
        
        return {
          ...item,
          y: newY,
        }
      }).filter(item => item !== null) // Remove null items

      return updated
    })
  }, [basketPosition, playSound])
  
  // Animation loop effect
  useEffect(() => {
    if (gameState !== "playing") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    console.log("Starting animation loop")
    let isRunning = true
    let lastTime = performance.now()
    
    const gameLoop = (currentTime) => {
      if (!isRunning) return
      
      const deltaTime = currentTime - lastTime
      
      // Update game at ~60fps (every ~16ms)
      if (deltaTime >= 16) {
        updateGame()
        lastTime = currentTime
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      isRunning = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [gameState, updateGame])

  // Handle touch/mouse movement
  const handleMove = useCallback(
    (clientX, rect) => {
      if (gameState !== "playing") return
      const percentage = ((clientX - rect.left) / rect.width) * 100
      setBasketPosition(Math.max(5, Math.min(95, percentage)))
    },
    [gameState]
  )

  const handleTouchMove = useCallback(
    e => {
      e.preventDefault()
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        const touch = e.touches[0] || e.changedTouches[0]
        handleMove(touch.clientX, rect)
      }
    },
    [handleMove]
  )

  const handleMouseMove = useCallback(
    e => {
      if (gameState !== "playing") return
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        handleMove(e.clientX, rect)
      }
    },
    [handleMove, gameState]
  )
  
  const handleMouseDown = useCallback(
    e => {
      if (gameState !== "playing") return
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        handleMove(e.clientX, rect)
      }
    },
    [handleMove, gameState]
  )
  
  const handleTouchStart = useCallback(
    e => {
      e.preventDefault()
      if (gameState !== "playing") return
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect()
        const touch = e.touches[0]
        handleMove(touch.clientX, rect)
      }
    },
    [handleMove, gameState]
  )

  // Start game
  const startGame = useCallback(() => {
    // Clean up any existing timers
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    
    // Reset state
    setScore(0)
    setLives(3)
    setTimeLeft(60)
    setFallingItems([])
    setBasketPosition(50)
    
    // Set game state to playing
    setGameState("playing")
  }, [])
  
  // Effect to manage game timers and animation loop when gameState changes
  useEffect(() => {
    if (gameState === "playing") {
      console.log("Starting game timers, difficulty:", difficulty)
      // Start spawning items
      const spawnRate = DIFFICULTY_LEVELS[difficulty].spawnRate
      console.log("Spawn rate:", spawnRate)
      spawnTimerRef.current = setInterval(() => {
        console.log("Spawn timer tick")
        spawnItem()
      }, spawnRate)

      // Start game timer
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState("gameOver")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
        if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      }
    } else {
      // Clean up when not playing
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    }
  }, [gameState, difficulty, spawnItem])

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (gameState === "playing") {
      setGameState("paused")
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current)
    } else if (gameState === "paused") {
      setGameState("playing")
      const spawnRate = DIFFICULTY_LEVELS[difficulty].spawnRate
      spawnTimerRef.current = setInterval(spawnItem, spawnRate)
      gameTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState("gameOver")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      animationFrameRef.current = requestAnimationFrame(updateGame)
    }
  }, [gameState, difficulty, spawnItem, updateGame])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState("menu")
    setScore(0)
    setLives(3)
    setTimeLeft(60)
    setFallingItems([])
    setBasketPosition(50)

    // Clean up timers
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

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
            className={`relative ${styles.modalBg} rounded-3xl shadow-2xl w-[95vw] max-w-4xl h-[85vh] flex flex-col overflow-hidden`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-5 ${styles.headerBg} shadow-md z-10`}
            >
              <div className="flex items-center gap-3">
                <h2
                  className={`text-xl lg:text-2xl font-bold ${styles.headerText}`}
                >
                  {variant === "newspaper"
                    ? "OOGST TIJD"
                    : "Oogst Tijd"}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {gameState === "playing" && (
                  <motion.button
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                    onClick={togglePause}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pause size={22} />
                  </motion.button>
                )}
                {gameState === "paused" && (
                  <motion.button
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                    onClick={togglePause}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Play size={22} />
                  </motion.button>
                )}
                <motion.button
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  onClick={resetGame}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw size={22} />
                </motion.button>
                <motion.button
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
            </div>

            {/* Game Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {gameState === "menu" ? (
                /* Menu Screen */
                <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
                  <div className="text-center">
                    <h3
                      className={`text-3xl lg:text-4xl font-bold mb-4 ${styles.textPrimary}`}
                    >
                      Oogst Tijd!
                    </h3>
                    <p className={`text-lg ${styles.textSecondary} max-w-md`}>
                      Vang de goede items in je mandje en vermijd de slechte!
                      Beweeg je vinger over het scherm om te sturen.
                    </p>
                  </div>

                  {/* Difficulty Selection */}
                  <div className="flex gap-4">
                    {["easy", "medium", "hard"].map(level => (
                      <motion.button
                        key={level}
                        className={`px-6 py-3 rounded-xl font-bold ${
                          difficulty === level
                            ? styles.buttonPrimary
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setDifficulty(level)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {level === "easy"
                          ? "Makkelijk"
                          : level === "medium"
                          ? "Normaal"
                          : "Moeilijk"}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    className={`px-12 py-4 rounded-2xl font-bold text-xl shadow-lg ${styles.buttonPrimary}`}
                    onClick={startGame}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Spel
                  </motion.button>
                </div>
              ) : gameState === "gameOver" ? (
                /* Game Over Screen */
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Trophy size={100} className="text-[#22c55e]" />
                  </motion.div>
                  <h3
                    className={`text-3xl lg:text-4xl font-bold ${styles.textPrimary}`}
                  >
                    Spel Afgelopen!
                  </h3>
                  <p className={`text-2xl font-bold ${styles.textPrimary}`}>
                    Score: {score}
                  </p>
                  <div className="flex gap-4">
                    <motion.button
                      className={`px-8 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}
                      onClick={startGame}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Opnieuw Spelen
                    </motion.button>
                    <motion.button
                      className="px-8 py-3 rounded-xl font-bold bg-gray-200 text-gray-700"
                      onClick={resetGame}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Menu
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* Game Screen */
                <div className="flex-1 flex flex-col">
                  {/* Stats Bar */}
                  <div
                    className={`p-4 ${styles.headerBg} bg-opacity-50 flex items-center justify-between text-white`}
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-sm opacity-80">Score:</span>
                        <span className="ml-2 text-xl font-bold">{score}</span>
                      </div>
                      <div>
                        <span className="text-sm opacity-80">Levens:</span>
                        <span className="ml-2 text-xl font-bold">
                          {"❤️".repeat(lives)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm opacity-80">Tijd:</span>
                        <span className="ml-2 text-xl font-bold">
                          {timeLeft}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Game Area */}
                  <div
                    ref={gameAreaRef}
                    className="flex-1 relative overflow-hidden bg-gradient-to-b from-blue-100 to-green-100"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    style={{ touchAction: "none", userSelect: "none" }}
                  >
                    {/* Falling Items */}
                    {fallingItems.map(item => (
                      <div
                        key={item.id}
                        className="absolute text-5xl select-none pointer-events-none z-10"
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          transform: "translate(-50%, -50%)",
                          transition: "none" // Ensure no CSS transitions interfere
                        }}
                      >
                        {item.emoji}
                      </div>
                    ))}

                    {/* Basket */}
                    <motion.div
                      className="absolute bottom-8 text-6xl select-none pointer-events-none"
                      style={{
                        left: `${basketPosition}%`,
                        transform: "translateX(-50%)",
                      }}
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      🧺
                    </motion.div>

                    {/* Pause Overlay */}
                    {gameState === "paused" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <div className="bg-white rounded-2xl p-8 text-center">
                          <h3
                            className={`text-2xl font-bold mb-4 ${styles.textPrimary}`}
                          >
                            Gepauzeerd
                          </h3>
                          <motion.button
                            className={`px-6 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}
                            onClick={togglePause}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Hervatten
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default HarvestGame
