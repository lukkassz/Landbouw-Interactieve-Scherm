/**
 * HarvestGame Component (Oogst Tijd) - Canvas Version
 *
 * A high-performance arcade game using HTML5 Canvas.
 * Features:
 * - Smooth 60FPS animation loop
 * - Particle effects on catch
 * - Rotating falling items
 * - Responsive rendering
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw, Trophy, Play, Pause, Heart } from "lucide-react"
import { getTheme } from "../../config/themes"
import { useSound } from "../../hooks/useSound"

// Game configuration
const GAME_CONFIG = {
  basketSize: 80, // pixels
  itemSize: 50,   // pixels
  spawnRate: {
    easy: 1000,
    medium: 750,
    hard: 500
  },
  speed: {
    easy: 200,    // pixels per second
    medium: 300,
    hard: 400
  }
}

// Game objects
const GOOD_ITEMS = {
  landbouw: ["🌾", "🌽", "🥔", "🥕", "🍅", "🥬", "🥛", "🥚", "🚜", "🧺"],
  museum: ["📜", "🏛️", "🕰️", "📚", "🖼️", "🔍", "📖", "⚱️"],
  maatschappelijk: ["📰", "✍️", "📸", "📻", "🚂", "🏭", "👥", "🌍"],
}

const BAD_ITEMS = ["🗿", "💣", "☠️", "❌", "🚫", "⛔"]

const HarvestGame = ({ isOpen, onClose, variant = "museum" }) => {
  const theme = getTheme()
  const playSound = useSound()

  // React State for UI overlays (Score, Lives, Menus) - NOT for game entities
  const [gameState, setGameState] = useState("menu") // menu, playing, paused, gameOver
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(60)
  const [difficulty, setDifficulty] = useState("medium")
  const [highScore, setHighScore] = useState(0)

  // Refs for Game Engine
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  const scoreRef = useRef(0) // Ref for sync inside loop
  const livesRef = useRef(3)
  const timeRef = useRef(60)
  const lastTimeRef = useRef(0)
  const spawnTimerRef = useRef(0)
  
  // Game Entities Refs
  const itemsRef = useRef([])
  const particlesRef = useRef([])
  const basketRef = useRef({ x: 0, width: GAME_CONFIG.basketSize, height: GAME_CONFIG.basketSize })
  const mouseRef = useRef({ x: 0 })

  // Theme styles
  const styles = useMemo(() => {
    switch (variant) {
      case "landbouw":
        return {
          modalBg: "bg-[#f3eeda] bg-[radial-gradient(circle_at_center,#f2ebd4_0%,#d9ceae_100%)]",
          headerBg: "bg-[#7c8f38]",
          headerText: "text-[#f3eeda]",
          textPrimary: "text-[#3a2d20]",
          buttonPrimary: "bg-[#7c8f38] text-white hover:bg-[#6a7d2e]",
        }
      case "newspaper":
      case "maatschappelijk":
        return {
          modalBg: "bg-[#f0f0f0] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]",
          headerBg: "bg-[#1a1a1a]",
          headerText: "text-[#f0f0f0] font-serif uppercase",
          textPrimary: "text-black font-serif",
          buttonPrimary: "bg-[#1a1a1a] text-white hover:bg-black",
        }
      case "museum":
      default:
        return {
          modalBg: "bg-[#f3f2e9]",
          headerBg: "bg-gradient-to-r from-[#c9a300] to-[#a68600]",
          headerText: "text-white font-heading",
          textPrimary: "text-[#440f0f]",
          buttonPrimary: "bg-[#c9a300] text-white hover:bg-[#b89300]",
        }
    }
  }, [variant])

  // --- GAME ENGINE FUNCTIONS ---

  const spawnItem = useCallback((canvasWidth) => {
    const isGood = Math.random() > 0.3 // 70% chance for good item
    const collection = isGood 
      ? (GOOD_ITEMS[variant === "newspaper" ? "maatschappelijk" : variant] || GOOD_ITEMS.museum)
      : BAD_ITEMS
    
    const emoji = collection[Math.floor(Math.random() * collection.length)]
    
    // Spawn x position: keep within canvas bounds
    const padding = 40
    const x = Math.random() * (canvasWidth - padding * 2) + padding

    itemsRef.current.push({
      id: Math.random(),
      x,
      y: -50,
      emoji,
      isGood,
      speed: GAME_CONFIG.speed[difficulty] * (0.8 + Math.random() * 0.4), // Randomize speed slightly
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 4,
      scale: 0, // for pop-in animation
      targetScale: 1
    })
  }, [difficulty, variant])

  const createParticles = (x, y, color) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 400,
        vy: (Math.random() - 0.5) * 400,
        life: 1.0,
        color: color,
        size: Math.random() * 5 + 3
      })
    }
  }

  const update = useCallback((dt, canvas) => {
    if (gameState !== 'playing') return

    // 1. Update Time
    timeRef.current -= dt
    if (timeRef.current <= 0) {
      timeRef.current = 0
      setGameState("gameOver")
      setTimeLeft(0)
      return
    }
    // Sync React state for UI timer occasionally (e.g. every second change)
    if (Math.ceil(timeRef.current) !== timeLeft) {
        setTimeLeft(Math.ceil(timeRef.current))
    }

    // 2. Update Basket
    // Smoothly interpolate basket position towards mouse/touch
    const targetX = mouseRef.current.x
    // Simple lerp for smoothness
    basketRef.current.x += (targetX - basketRef.current.x) * 10 * dt
    
    // Clamp basket
    const halfBasket = basketRef.current.width / 2
    if (basketRef.current.x < halfBasket) basketRef.current.x = halfBasket
    if (basketRef.current.x > canvas.width - halfBasket) basketRef.current.x = canvas.width - halfBasket

    // 3. Spawn Items
    spawnTimerRef.current += dt * 1000
    if (spawnTimerRef.current > GAME_CONFIG.spawnRate[difficulty]) {
      spawnItem(canvas.width)
      spawnTimerRef.current = 0
    }

    // 4. Update Items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i]
      
      // Move
      item.y += item.speed * dt
      item.rotation += item.rotationSpeed * dt
      
      // Pop-in scale
      if (item.scale < item.targetScale) {
        item.scale += dt * 5
        if (item.scale > item.targetScale) item.scale = item.targetScale
      }

      // Collision Detection
      const dy = item.y - (canvas.height - 80) // Basket is roughly at bottom - 80px
      const dx = item.x - basketRef.current.x
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      // Hit Basket
      if (dist < (GAME_CONFIG.basketSize/2 + GAME_CONFIG.itemSize/2) && item.y > canvas.height - 150) {
        if (item.isGood) {
          scoreRef.current += 10
          setScore(scoreRef.current)
          playSound() // Play sound
          createParticles(item.x, item.y, "#FFD700") // Gold particles
        } else {
          livesRef.current -= 1
          setLives(livesRef.current)
          createParticles(item.x, item.y, "#FF0000") // Red particles
          // Shake effect could be added here
          if (livesRef.current <= 0) {
            setGameState("gameOver")
          }
        }
        itemsRef.current.splice(i, 1)
        continue
      }

      // Missed (went off screen)
      if (item.y > canvas.height + 50) {
        if (item.isGood) {
           // Penalty for missing good items? Optional. 
           // For now, let's just lose a life if you miss a good item to make it challenging
           livesRef.current -= 1
           setLives(livesRef.current)
           if (livesRef.current <= 0) {
             setGameState("gameOver")
           }
        }
        itemsRef.current.splice(i, 1)
        continue
      }
    }

    // 5. Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt * 2 // Fade out speed
      if (p.life <= 0) {
        particlesRef.current.splice(i, 1)
      }
    }

  }, [gameState, difficulty, spawnItem, timeLeft, playSound, variant])

  const draw = useCallback((ctx, canvas) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw Basket
    ctx.font = `${GAME_CONFIG.basketSize}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.2)"
    ctx.shadowBlur = 10
    ctx.fillText("🧺", basketRef.current.x, canvas.height - 50)
    ctx.shadowBlur = 0

    // Draw Items
    itemsRef.current.forEach(item => {
      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(item.rotation)
      ctx.scale(item.scale, item.scale)
      
      ctx.font = `${GAME_CONFIG.itemSize}px Arial`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(item.emoji, 0, 0)
      
      ctx.restore()
    })

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1.0
    })

  }, [])

  // Main Loop
  const loop = useCallback((time) => {
    if (gameState !== 'playing' && gameState !== 'paused') {
        // Keep drawing one frame to show state if needed, but mostly stop
        return 
    }
    
    if (gameState === 'paused') {
        requestRef.current = requestAnimationFrame(loop)
        lastTimeRef.current = time
        return
    }

    const dt = (time - lastTimeRef.current) / 1000
    lastTimeRef.current = time

    // Cap dt to prevent huge jumps if tab was inactive
    const safeDt = Math.min(dt, 0.1)

    const canvas = canvasRef.current
    if (canvas) {
        const ctx = canvas.getContext('2d')
        update(safeDt, canvas)
        draw(ctx, canvas)
    }

    requestRef.current = requestAnimationFrame(loop)
  }, [gameState, update, draw])

  // --- EVENT HANDLERS ---

  const startGame = () => {
    // Reset Refs
    scoreRef.current = 0
    livesRef.current = 3
    timeRef.current = 60
    itemsRef.current = []
    particlesRef.current = []
    lastTimeRef.current = performance.now()
    spawnTimerRef.current = 0
    
    // Reset State
    setScore(0)
    setLives(3)
    setTimeLeft(60)
    setGameState("playing")
    
    // Start Loop
    requestRef.current = requestAnimationFrame(loop)
  }

  const resetGame = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current)
    setGameState("menu")
    setScore(0)
    setLives(3)
    itemsRef.current = []
  }

  const togglePause = () => {
    setGameState(prev => prev === "playing" ? "paused" : "playing")
  }

  // --- EFFECTS ---

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current && canvasRef.current.parentElement) {
            const parent = canvasRef.current.parentElement
            canvasRef.current.width = parent.clientWidth
            canvasRef.current.height = parent.clientHeight
            // Reset basket to center on resize
            basketRef.current.x = parent.clientWidth / 2
        }
    }
    
    window.addEventListener('resize', handleResize)
    
    // Initial size
    if (isOpen) {
        setTimeout(handleResize, 100)
    }
    
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  // Mouse/Touch Move Handlers
  const handleInput = useCallback((clientX) => {
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        mouseRef.current.x = clientX - rect.left
    }
  }, [])

  // Start loop when game state becomes playing (needed for restart)
  useEffect(() => {
    if (gameState === "playing") {
        lastTimeRef.current = performance.now()
        requestRef.current = requestAnimationFrame(loop)
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, loop])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
            className={`relative ${styles.modalBg} rounded-3xl shadow-2xl w-[95vw] max-w-4xl h-[85vh] flex flex-col overflow-hidden border-4 border-white/20`}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 ${styles.headerBg} shadow-md z-10 text-white`}>
                <h2 className={`text-2xl font-bold ${styles.headerText}`}>
                    {variant === "newspaper" ? "OOGST TIJD" : "Oogst Tijd"}
                </h2>
                
                {gameState === "playing" && (
                    <div className="flex gap-6 font-bold text-lg">
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg">
                            <span>Score:</span>
                            <span className="text-yellow-300">{score}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-lg">
                            {Array.from({length: Math.max(0, lives)}).map((_, i) => (
                                <Heart key={i} size={20} className="fill-red-500 text-red-500" />
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg">
                            <span>Tijd:</span>
                            <span className={`${timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                {timeLeft}s
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    {gameState !== "menu" && gameState !== "gameOver" && (
                        <button onClick={togglePause} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            {gameState === "paused" ? <Play size={24} /> : <Pause size={24} />}
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 relative cursor-none bg-gradient-to-b from-blue-200/50 to-green-100/50">
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full touch-none"
                    onMouseMove={(e) => handleInput(e.clientX)}
                    onTouchMove={(e) => handleInput(e.touches[0].clientX)}
                    onTouchStart={(e) => handleInput(e.touches[0].clientX)}
                />

                {/* Overlays */}
                <AnimatePresence>
                    {gameState === "menu" && (
                        <motion.div 
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <h1 className={`text-5xl font-bold mb-2 ${styles.textPrimary}`}>Oogst Tijd!</h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-md text-center">
                                Vang de juiste items in je mandje. Vermijd de bommen!
                            </p>
                            
                            <div className="flex gap-4 mb-8">
                                {['easy', 'medium', 'hard'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
                                            difficulty === level 
                                                ? styles.buttonPrimary 
                                                : 'bg-white text-gray-600 border-2 border-gray-200'
                                        }`}
                                    >
                                        {level === 'easy' ? 'Makkelijk' : level === 'medium' ? 'Normaal' : 'Moeilijk'}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={startGame}
                                className={`px-12 py-4 text-2xl font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all ${styles.buttonPrimary}`}
                            >
                                Start Spel
                            </button>
                        </motion.div>
                    )}

                    {gameState === "paused" && (
                        <motion.div 
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
                                <h2 className="text-3xl font-bold mb-6">Gepauzeerd</h2>
                                <button
                                    onClick={togglePause}
                                    className={`px-8 py-3 font-bold rounded-xl ${styles.buttonPrimary}`}
                                >
                                    Hervatten
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div 
                            className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Trophy size={80} className="text-yellow-500 mb-4" />
                            <h2 className={`text-4xl font-bold mb-2 ${styles.textPrimary}`}>Spel Afgelopen!</h2>
                            <p className="text-2xl text-gray-600 mb-8">
                                Je score: <span className="font-bold text-black">{score}</span>
                            </p>
                            
                            <div className="flex gap-4">
                                <button
                                    onClick={startGame}
                                    className={`px-8 py-3 font-bold rounded-xl shadow-lg ${styles.buttonPrimary}`}
                                >
                                    Opnieuw Spelen
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="px-8 py-3 font-bold rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                    Menu
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default HarvestGame
