/**
 * MemoryGame Component
 *
 * A memory card matching game with:
 * - Grid of cards with emoji images
 * - Fixed card flip animation
 * - Database-connected leaderboard
 * - Virtual keyboard for name entry
 */

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw, Trophy, Clock } from "lucide-react"
import { getTheme } from "../../config/themes"
import { useSound } from "../../hooks/useSound"
import { api } from "../../services/api"
import VirtualKeyboard from "../Common/VirtualKeyboard"

// Thematic icon sets for Memory Game - Expanded with more variety
const THEME_ICONS = {
  // Landbouw / Agriculture
  landbouw: {
    default: ["🌾", "🚜", "🐄", "🐷", "🐔", "🌽", "🥛", "🥚"],
    animals: ["🐄", "🐷", "🐑", "🐔", "🦆", "🐐", "🐴", "🐰"],
    crops: ["🌾", "🌽", "🥔", "🥕", "🍅", "🥬", "🌻", "🌿"],
    tools: ["🚜", "🔨", "⚒️", "🌾", "🌽", "🥛", "🥚", "🧺"],
  },
  // Museum / History
  museum: {
    default: ["📜", "🏛️", "🕰️", "📚", "🖼️", "🔍", "📖", "⚱️"],
    history: ["📜", "🕰️", "⚱️", "🏺", "🗿", "📚", "🖼️", "🔍"],
    artifacts: ["⚱️", "🏺", "🗿", "💎", "👑", "⚔️", "🛡️", "📜"],
    books: ["📚", "📖", "📜", "✍️", "🖋️", "📝", "📰", "📑"],
  },
  // Maatschappelijk / Society / War
  maatschappelijk: {
    default: ["📰", "✍️", "📸", "📻", "🚂", "🏭", "👥", "🌍"],
    war: ["⚔️", "🛡️", "🎖️", "📰", "✍️", "📸", "🚂", "🏭"],
    society: ["👥", "🏛️", "📰", "✍️", "📸", "📻", "🚂", "🌍"],
    news: ["📰", "✍️", "📸", "📻", "📡", "📺", "📷", "🎬"],
  },
}

// Detect theme from event data - improved with category and icon support
const detectTheme = (
  title = "",
  description = "",
  variant = "museum",
  category = null,
  icon = null,
  year = null
) => {
  const text = (title + " " + description).toLowerCase()

  // Use category as primary indicator if available
  const effectiveVariant = category || variant

  // Landbouw themes
  if (effectiveVariant === "landbouw" || effectiveVariant === "Landbouw") {
    // Check for specific animal keywords
    if (
      text.match(
        /\b(dier|animal|koe|cow|varken|pig|kip|chicken|schaap|sheep|paard|horse|geit|goat|eend|duck|konijn|rabbit)\b/
      ) ||
      icon?.match(/🐄|🐷|🐑|🐔|🦆|🐐|🐴|🐰/)
    ) {
      return "animals"
    }
    // Check for crop keywords
    if (
      text.match(
        /\b(gewas|crop|graan|grain|mais|corn|aardappel|potato|groente|vegetable|fruit|tarwe|wheat)\b/
      ) ||
      icon?.match(/🌾|🌽|🥔|🥕|🍅|🥬|🌻|🌿/)
    ) {
      return "crops"
    }
    // Check for tools/machinery keywords
    if (
      text.match(
        /\b(tractor|machine|gereedschap|tool|werktuig|ploeg|plow|zaaien|planten)\b/
      ) ||
      icon?.match(/🚜|🔨|⚒️|🧺/)
    ) {
      return "tools"
    }
    return "default"
  }

  // Museum themes
  if (effectiveVariant === "museum" || !effectiveVariant) {
    // Check for history keywords
    if (
      text.match(
        /\b(geschiedenis|history|historisch|oud|ancient|verleden|tijdperk|era|periode)\b/
      ) ||
      (year && parseInt(year) < 1950)
    ) {
      return "history"
    }
    // Check for artifacts keywords
    if (
      text.match(
        /\b(artefact|voorwerp|object|vondst|archeolog|museum|collectie|expositie)\b/
      ) ||
      icon?.match(/⚱️|🏺|🗿|💎|👑|⚔️|🛡️/)
    ) {
      return "artifacts"
    }
    // Check for books/documents keywords
    if (
      text.match(
        /\b(boek|book|document|archief|bibliotheek|schrift|manuscript|papier)\b/
      ) ||
      icon?.match(/📚|📖|📜|✍️|🖋️|📝/)
    ) {
      return "books"
    }
    return "default"
  }

  // Maatschappelijk themes
  if (
    effectiveVariant === "newspaper" ||
    effectiveVariant === "maatschappelijk" ||
    effectiveVariant === "Maatschappelijk"
  ) {
    // Check for war keywords
    if (
      text.match(
        /\b(oorlog|war|strijd|battle|militair|soldaat|soldier|vredes|peace|conflict)\b/
      ) ||
      icon?.match(/⚔️|🛡️|🎖️/)
    ) {
      return "war"
    }
    // Check for society keywords
    if (
      text.match(
        /\b(maatschappij|society|samenleving|gemeenschap|volk|people|social|gemeente)\b/
      ) ||
      icon?.match(/👥|🏛️|🌍/)
    ) {
      return "society"
    }
    // Check for news/media keywords
    if (
      text.match(
        /\b(nieuws|news|krant|gazet|journalist|verslag|media|pers|publicatie)\b/
      ) ||
      icon?.match(/📰|✍️|📸|📻|📡|📺|📷/)
    ) {
      return "news"
    }
    return "default"
  }

  return "default"
}

const MemoryGame = ({
  isOpen,
  onClose,
  images = null,
  variant = "museum",
  eventTitle = "",
  eventDescription = "",
  eventCategory = null, // Direct category from event (landbouw, maatschappelijk, museum)
  eventIcon = null, // Icon emoji from event
  eventYear = null, // Year of event for historical context
}) => {
  const theme = getTheme()
  const playSound = useSound()

  // Theme Styles Configuration - memoized for performance
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
          button1Player:
            "bg-gradient-to-br from-[#7c8f38] via-[#6a7d2e] to-[#5a6d24] border-4 border-[#4a5d1a]",
          button2Players:
            "bg-gradient-to-br from-[#8b5a2b] via-[#7a4a1b] to-[#6a3a0b] border-4 border-[#5a2a00]",
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
          button1Player: "bg-[#1a1a1a] border-4 border-black",
          button2Players: "bg-white border-4 border-black",
        }
      case "museum":
      default:
        return {
          modalBg: "bg-[#f3f2e9]",
          headerBg: "bg-gradient-to-r from-[#c9a300] to-[#a68600]",
          headerText: "text-white font-heading",
          textPrimary: "text-[#440f0f]",
          textSecondary: "text-[#657575]",
          button1Player:
            "bg-gradient-to-br from-[#5c9a4d] via-[#4a8a3d] to-[#3a7a2d] border-4 border-[#2a6a1d]",
          button2Players:
            "bg-gradient-to-br from-[#c9514d] via-[#b9413d] to-[#a9312d] border-4 border-[#99211d]",
        }
    }
  }, [variant])

  // Game mode state
  const [gameMode, setGameMode] = useState(null) // null = selection, 1 = single, 2 = two players

  // Single player game state
  const [cards, setCards] = useState([])
  const [flippedCards, setFlippedCards] = useState([])
  const [matchedPairs, setMatchedPairs] = useState([])
  const [moves, setMoves] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  // Two players game state (race mode - split screen)
  const [player1Cards, setPlayer1Cards] = useState([])
  const [player1FlippedCards, setPlayer1FlippedCards] = useState([])
  const [player1MatchedPairs, setPlayer1MatchedPairs] = useState([])
  const [player1Moves, setPlayer1Moves] = useState(0)
  const [player1Started, setPlayer1Started] = useState(false)
  const [player1Won, setPlayer1Won] = useState(false)
  const [player1Time, setPlayer1Time] = useState(0)

  const [player2Cards, setPlayer2Cards] = useState([])
  const [player2FlippedCards, setPlayer2FlippedCards] = useState([])
  const [player2MatchedPairs, setPlayer2MatchedPairs] = useState([])
  const [player2Moves, setPlayer2Moves] = useState(0)
  const [player2Started, setPlayer2Started] = useState(false)
  const [player2Won, setPlayer2Won] = useState(false)
  const [player2Time, setPlayer2Time] = useState(0)

  const [raceWinner, setRaceWinner] = useState(null) // null, 1, or 2

  // Leaderboard state
  const [scores, setScores] = useState([])
  const [loadingScores, setLoadingScores] = useState(true)

  // Win screen state
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [savedRank, setSavedRank] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isSavingScore, setIsSavingScore] = useState(false)

  // Memoized flattened matched pairs for performance optimization
  const flattenedMatchedPairs = useMemo(() => {
    return matchedPairs.flat()
  }, [matchedPairs])

  const flattenedPlayer1MatchedPairs = useMemo(() => {
    return player1MatchedPairs.flat()
  }, [player1MatchedPairs])

  const flattenedPlayer2MatchedPairs = useMemo(() => {
    return player2MatchedPairs.flat()
  }, [player2MatchedPairs])

  // Detect theme and get appropriate icon set - improved with category and icon
  const detectedTheme = useMemo(() => {
    return detectTheme(
      eventTitle,
      eventDescription,
      variant,
      eventCategory,
      eventIcon,
      eventYear
    )
  }, [
    eventTitle,
    eventDescription,
    variant,
    eventCategory,
    eventIcon,
    eventYear,
  ])

  // Use provided images or thematic emoji images based on event content
  const gameImages = useMemo(() => {
    const pairs = []

    // If event has images, use them
    if (images && Array.isArray(images) && images.length >= 4) {
      const imageSet = images.slice(0, 8)
      imageSet.forEach((img, index) => {
        pairs.push({ id: index * 2, image: img, type: index })
        pairs.push({ id: index * 2 + 1, image: img, type: index })
      })
      return pairs
    }

    // Otherwise, use thematic icons based on detected theme
    // Use category if available, otherwise fall back to variant
    const categoryKey =
      eventCategory?.toLowerCase() ||
      (variant === "newspaper" ? "maatschappelijk" : variant)

    const themeIcons =
      THEME_ICONS[categoryKey]?.[detectedTheme] ||
      THEME_ICONS[categoryKey]?.default ||
      THEME_ICONS.museum.default

    // If event has an icon, try to include it in the set (if it matches the theme)
    let iconsToUse = [...themeIcons]
    if (eventIcon && !iconsToUse.includes(eventIcon)) {
      // Replace first icon with event icon if it's relevant
      iconsToUse[0] = eventIcon
    }

    iconsToUse.forEach((icon, index) => {
      pairs.push({ id: index * 2, image: icon, type: index })
      pairs.push({ id: index * 2 + 1, image: icon, type: index })
    })

    return pairs
  }, [images, detectedTheme, variant, eventCategory, eventIcon])

  // Shuffle cards
  const shuffleCards = useCallback(cardsArray => {
    const shuffled = [...cardsArray]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.map((card, index) => ({
      ...card,
      id: index,
    }))
  }, [])

  // Reset game
  const resetGame = useCallback(() => {
    const shuffled = shuffleCards(gameImages)

    // Reset single player state
    setCards(shuffled)
    setFlippedCards([])
    setMatchedPairs([])
    setMoves(0)
    setGameStarted(false)
    setGameWon(false)
    setTimeElapsed(0)

    // Reset two players state
    setPlayer1Cards(shuffled)
    setPlayer1FlippedCards([])
    setPlayer1MatchedPairs([])
    setPlayer1Moves(0)
    setPlayer1Started(false)
    setPlayer1Won(false)
    setPlayer1Time(0)

    setPlayer2Cards(shuffled)
    setPlayer2FlippedCards([])
    setPlayer2MatchedPairs([])
    setPlayer2Moves(0)
    setPlayer2Started(false)
    setPlayer2Won(false)
    setPlayer2Time(0)

    setRaceWinner(null)
    setSavedRank(null)
    setSaveError("")
    setShowLeaderboard(false)
    setGameMode(null)
  }, [gameImages, shuffleCards])

  // Start game with selected mode
  const startGame = useCallback(
    mode => {
      const shuffled = shuffleCards(gameImages)

      if (mode === 1) {
        // Single player mode
        setCards(shuffled)
        setFlippedCards([])
        setMatchedPairs([])
        setMoves(0)
        setGameStarted(false)
        setGameWon(false)
        setTimeElapsed(0)
      } else if (mode === 2) {
        // Two players race mode - both get the same shuffled cards
        setPlayer1Cards(shuffled)
        setPlayer1FlippedCards([])
        setPlayer1MatchedPairs([])
        setPlayer1Moves(0)
        setPlayer1Started(false)
        setPlayer1Won(false)
        setPlayer1Time(0)

        setPlayer2Cards(shuffled)
        setPlayer2FlippedCards([])
        setPlayer2MatchedPairs([])
        setPlayer2Moves(0)
        setPlayer2Started(false)
        setPlayer2Won(false)
        setPlayer2Time(0)

        setRaceWinner(null)
      }

      setSavedRank(null)
      setSaveError("")
      setShowLeaderboard(false)
      setGameMode(mode)
    },
    [gameImages, shuffleCards]
  )

  // Fetch leaderboard
  const fetchScores = useCallback(async () => {
    setLoadingScores(true)
    try {
      const result = await api.getMemoryScores()
      if (result.success) {
        setScores(result.scores || [])
      }
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
      setIsSavingScore(true)
      try {
        const result = await api.saveMemoryScore(playerName, moves, timeElapsed)
        if (result.success) {
          setSavedRank(result.rank)
          setScores(result.scores || [])
          setShowKeyboard(false)
        } else {
          setSaveError(result.message || "Failed to save score")
        }
      } catch (error) {
        setSaveError("Failed to save score. Try again.")
      } finally {
        setIsSavingScore(false)
      }
    },
    [moves, timeElapsed]
  )

  // Initialize
  useEffect(() => {
    if (isOpen) {
      resetGame()
      fetchScores()
    }
  }, [isOpen, resetGame, fetchScores])

  // Timer for single player
  useEffect(() => {
    let interval = null
    if (gameMode === 1 && gameStarted && !gameWon && isOpen) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameMode, gameStarted, gameWon, isOpen])

  // Timer for player 1 (two players mode)
  useEffect(() => {
    let interval = null
    if (
      gameMode === 2 &&
      player1Started &&
      !player1Won &&
      !raceWinner &&
      isOpen
    ) {
      interval = setInterval(() => {
        setPlayer1Time(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameMode, player1Started, player1Won, raceWinner, isOpen])

  // Timer for player 2 (two players mode)
  useEffect(() => {
    let interval = null
    if (
      gameMode === 2 &&
      player2Started &&
      !player2Won &&
      !raceWinner &&
      isOpen
    ) {
      interval = setInterval(() => {
        setPlayer2Time(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [gameMode, player2Started, player2Won, raceWinner, isOpen])

  // Check if card is flipped or matched (single player) - optimized
  const isCardFlipped = useCallback(
    cardId => {
      return (
        flippedCards.includes(cardId) || flattenedMatchedPairs.includes(cardId)
      )
    },
    [flippedCards, flattenedMatchedPairs]
  )

  // Check if card is flipped or matched (player 1) - optimized
  const isPlayer1CardFlipped = useCallback(
    cardId => {
      return (
        player1FlippedCards.includes(cardId) ||
        flattenedPlayer1MatchedPairs.includes(cardId)
      )
    },
    [player1FlippedCards, flattenedPlayer1MatchedPairs]
  )

  // Check if card is flipped or matched (player 2) - optimized
  const isPlayer2CardFlipped = useCallback(
    cardId => {
      return (
        player2FlippedCards.includes(cardId) ||
        flattenedPlayer2MatchedPairs.includes(cardId)
      )
    },
    [player2FlippedCards, flattenedPlayer2MatchedPairs]
  )

  // Handle card click (single player)
  const handleCardClick = useCallback(
    cardId => {
      if (gameMode !== 1) return
      if (flippedCards.length >= 2 || gameWon) return
      if (isCardFlipped(cardId)) return

      playSound()

      if (!gameStarted) {
        setGameStarted(true)
      }

      const newFlipped = [...flippedCards, cardId]
      setFlippedCards(newFlipped)

      if (newFlipped.length === 2) {
        const [firstId, secondId] = newFlipped
        const firstCard = cards.find(c => c.id === firstId)
        const secondCard = cards.find(c => c.id === secondId)

        setMoves(prev => prev + 1)

        if (firstCard.type === secondCard.type) {
          setTimeout(() => {
            const newMatchedPairs = [...matchedPairs, [firstId, secondId]]
            setMatchedPairs(newMatchedPairs)
            setFlippedCards([])

            if (newMatchedPairs.length === gameImages.length / 2) {
              setGameWon(true)
            }
          }, 600)
        } else {
          setTimeout(() => {
            setFlippedCards([])
          }, 1000)
        }
      }
    },
    [
      gameMode,
      flippedCards,
      cards,
      matchedPairs,
      gameWon,
      gameStarted,
      gameImages.length,
      playSound,
      isCardFlipped,
    ]
  )

  // Handle card click (player 1 - race mode)
  const handlePlayer1CardClick = useCallback(
    cardId => {
      if (gameMode !== 2) return
      if (player1FlippedCards.length >= 2 || player1Won || raceWinner) return
      if (isPlayer1CardFlipped(cardId)) return

      playSound()

      if (!player1Started) {
        setPlayer1Started(true)
      }

      const newFlipped = [...player1FlippedCards, cardId]
      setPlayer1FlippedCards(newFlipped)

      if (newFlipped.length === 2) {
        const [firstId, secondId] = newFlipped
        const firstCard = player1Cards.find(c => c.id === firstId)
        const secondCard = player1Cards.find(c => c.id === secondId)

        setPlayer1Moves(prev => prev + 1)

        if (firstCard.type === secondCard.type) {
          setTimeout(() => {
            const newMatchedPairs = [
              ...player1MatchedPairs,
              [firstId, secondId],
            ]
            setPlayer1MatchedPairs(newMatchedPairs)
            setPlayer1FlippedCards([])

            if (newMatchedPairs.length === gameImages.length / 2) {
              setPlayer1Won(true)
              setRaceWinner(1)
            }
          }, 600)
        } else {
          setTimeout(() => {
            setPlayer1FlippedCards([])
          }, 1000)
        }
      }
    },
    [
      gameMode,
      player1FlippedCards,
      player1Cards,
      player1MatchedPairs,
      player1Won,
      player1Started,
      gameImages.length,
      playSound,
      isPlayer1CardFlipped,
      raceWinner,
    ]
  )

  // Handle card click (player 2 - race mode)
  const handlePlayer2CardClick = useCallback(
    cardId => {
      if (gameMode !== 2) return
      if (player2FlippedCards.length >= 2 || player2Won || raceWinner) return
      if (isPlayer2CardFlipped(cardId)) return

      playSound()

      if (!player2Started) {
        setPlayer2Started(true)
      }

      const newFlipped = [...player2FlippedCards, cardId]
      setPlayer2FlippedCards(newFlipped)

      if (newFlipped.length === 2) {
        const [firstId, secondId] = newFlipped
        const firstCard = player2Cards.find(c => c.id === firstId)
        const secondCard = player2Cards.find(c => c.id === secondId)

        setPlayer2Moves(prev => prev + 1)

        if (firstCard.type === secondCard.type) {
          setTimeout(() => {
            const newMatchedPairs = [
              ...player2MatchedPairs,
              [firstId, secondId],
            ]
            setPlayer2MatchedPairs(newMatchedPairs)
            setPlayer2FlippedCards([])

            if (newMatchedPairs.length === gameImages.length / 2) {
              setPlayer2Won(true)
              setRaceWinner(2)
            }
          }, 600)
        } else {
          setTimeout(() => {
            setPlayer2FlippedCards([])
          }, 1000)
        }
      }
    },
    [
      gameMode,
      player2FlippedCards,
      player2Cards,
      player2MatchedPairs,
      player2Won,
      player2Started,
      gameImages.length,
      playSound,
      isPlayer2CardFlipped,
      raceWinner,
    ]
  )

  // Format time
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

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
            className={`relative ${styles.modalBg} rounded-3xl shadow-2xl w-[98vw] max-w-6xl max-h-[95vh] flex flex-col overflow-hidden`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-5 ${styles.headerBg}`}
            >
              <div className="flex items-center gap-4">
                <h2
                  className={`text-2xl lg:text-3xl font-bold ${styles.headerText}`}
                >
                  {variant === "newspaper" ? "MEMORY SPEL" : "Memory Spel"}
                </h2>
                {gameMode === 2 && (
                  <div className="flex items-center gap-4 ml-4">
                    <div
                      className={`px-4 py-2 rounded-xl ${
                        player1Won
                          ? "bg-yellow-400/50"
                          : raceWinner === 1
                          ? "bg-yellow-400/50"
                          : "bg-white/20"
                      }`}
                    >
                      <span className="text-white font-bold">
                        Speler 1: {player1MatchedPairs.length}/
                        {gameImages.length / 2}
                      </span>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-xl ${
                        player2Won
                          ? "bg-yellow-400/50"
                          : raceWinner === 2
                          ? "bg-yellow-400/50"
                          : "bg-white/20"
                      }`}
                    >
                      <span className="text-white font-bold">
                        Speler 2: {player2MatchedPairs.length}/
                        {gameImages.length / 2}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {gameMode === 1 && (
                  <div className="text-white text-lg font-bold flex items-center gap-4">
                    <span>
                      Zetten: <span className="text-green-200">{moves}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={18} />
                      <span className="text-green-200">
                        {formatTime(timeElapsed)}
                      </span>
                    </span>
                  </div>
                )}

                <motion.button
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                  onClick={resetGame}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RotateCcw size={24} />
                </motion.button>

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
            <div className="flex-1 overflow-auto p-6 lg:p-8">
              {gameMode === null ? (
                /* Mode Selection Screen - Dynamic Style */
                <div className="flex flex-col items-center justify-center h-full gap-12 py-8">
                  <div className="text-center">
                    <h3
                      className={`text-3xl lg:text-5xl font-bold mb-3 ${
                        styles.textPrimary
                      } ${
                        variant === "newspaper"
                          ? "font-serif uppercase tracking-widest"
                          : "font-heading"
                      }`}
                    >
                      {variant === "newspaper"
                        ? "KIES SPELMODUS"
                        : "Kies je spelmodus"}
                    </h3>
                    <p className={`text-lg ${styles.textSecondary}`}>
                      {variant === "newspaper"
                        ? "Selecteer het aantal spelers"
                        : "Hoeveel spelers?"}
                    </p>
                  </div>

                  <div className="flex gap-8 lg:gap-12">
                    {/* Single Player Button */}
                    <motion.button
                      className={`relative flex flex-col items-center justify-center gap-5 w-56 h-72 lg:w-72 lg:h-80 rounded-2xl shadow-2xl transition-all overflow-hidden ${styles.button1Player}`}
                      onClick={() => startGame(1)}
                      whileHover={{ scale: 1.05, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Decorative Pattern */}
                      {variant !== "newspaper" && (
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyMCA0ME0wIDIwTDQwIDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]" />
                      )}

                      <span className="text-6xl relative z-10">👤</span>
                      <div className="text-center px-4 relative z-10">
                        <span
                          className={`text-2xl lg:text-3xl font-bold block ${
                            variant === "newspaper"
                              ? "text-white font-serif uppercase tracking-wider"
                              : "text-white"
                          }`}
                        >
                          {variant === "newspaper" ? "1 SPELER" : "1 Speler"}
                        </span>
                        <span
                          className={`text-sm lg:text-base opacity-90 block mt-2 ${
                            variant === "newspaper"
                              ? "text-gray-300 uppercase tracking-wide"
                              : "text-white/80"
                          }`}
                        >
                          Speel alleen
                        </span>
                      </div>
                    </motion.button>

                    {/* Two Players Button */}
                    <motion.button
                      className={`relative flex flex-col items-center justify-center gap-5 w-56 h-72 lg:w-72 lg:h-80 rounded-2xl shadow-2xl transition-all overflow-hidden ${styles.button2Players}`}
                      onClick={() => startGame(2)}
                      whileHover={{ scale: 1.05, y: -8 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Decorative Pattern */}
                      {variant !== "newspaper" && (
                        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyMCA0ME0wIDIwTDQwIDIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]" />
                      )}

                      <span
                        className={`text-6xl relative z-10 ${
                          variant === "newspaper" ? "" : ""
                        }`}
                      >
                        👥
                      </span>
                      <div className="text-center px-4 relative z-10">
                        <span
                          className={`text-2xl lg:text-3xl font-bold block ${
                            variant === "newspaper"
                              ? "text-black font-serif uppercase tracking-wider"
                              : "text-white"
                          }`}
                        >
                          {variant === "newspaper" ? "2 SPELERS" : "2 Spelers"}
                        </span>
                        <span
                          className={`text-sm lg:text-base opacity-90 block mt-2 ${
                            variant === "newspaper"
                              ? "text-gray-700 uppercase tracking-wide"
                              : "text-white/80"
                          }`}
                        >
                          Speel tegen elkaar
                        </span>
                      </div>
                    </motion.button>
                  </div>
                </div>
              ) : gameWon || raceWinner !== null ? (
                /* Win Screen */
                <motion.div
                  className="flex flex-col items-center justify-center h-full gap-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {showLeaderboard ? (
                    /* Leaderboard View */
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#a7b8b4]/30">
                        <h3 className="text-xl font-bold text-[#440f0f] mb-4 flex items-center gap-2">
                          <Trophy size={24} className="text-[#22c55e]" />
                          Beste Scores
                        </h3>

                        {loadingScores ? (
                          <div className="text-center py-4 text-[#657575]">
                            Laden...
                          </div>
                        ) : scores.length === 0 ? (
                          <div className="text-center py-4 text-[#657575]">
                            Nog geen scores
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {scores.slice(0, 10).map((score, index) => (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  index === 0
                                    ? "bg-yellow-50 border border-yellow-200"
                                    : index === 1
                                    ? "bg-gray-50 border border-gray-200"
                                    : index === 2
                                    ? "bg-orange-50 border border-orange-200"
                                    : "bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-lg font-bold ${
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
                                  <span className="font-medium text-[#440f0f]">
                                    {score.player_name}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`font-bold ${
                                      index === 0
                                        ? "text-yellow-600"
                                        : index === 1
                                        ? "text-gray-500"
                                        : index === 2
                                        ? "text-orange-500"
                                        : "text-[#657575]"
                                    }`}
                                  >
                                    {score.moves} zetten
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4 mt-6 justify-center">
                        <motion.button
                          className="px-6 py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-2xl font-bold shadow-lg"
                          onClick={resetGame}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          🔄 Opnieuw Spelen
                        </motion.button>
                        <motion.button
                          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-[#440f0f] rounded-2xl font-bold shadow-lg"
                          onClick={() => setShowLeaderboard(false)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          ← Terug
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    /* Win Message */
                    <>
                      {gameMode === 2 ? (
                        /* Two Players Race Win Screen */
                        <>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <Trophy
                              size={120}
                              className={
                                raceWinner === 1
                                  ? "text-blue-500"
                                  : raceWinner === 2
                                  ? "text-purple-500"
                                  : "text-yellow-500"
                              }
                            />
                          </motion.div>

                          {raceWinner === 1 ? (
                            <>
                              <h3 className="text-4xl lg:text-5xl font-bold text-blue-600">
                                Speler 1 Wint! 🎉
                              </h3>
                              <p className="text-xl text-[#657575]">
                                Speler 1 heeft alle paren gevonden in{" "}
                                <span className="font-bold text-blue-600">
                                  {player1Moves}
                                </span>{" "}
                                zetten en{" "}
                                <span className="font-bold text-blue-600">
                                  {formatTime(player1Time)}
                                </span>
                                !
                              </p>
                              <p className="text-lg text-[#657575] mt-2">
                                Speler 2:{" "}
                                <span className="font-bold text-purple-600">
                                  {player2MatchedPairs.length}
                                </span>{" "}
                                paren gevonden in{" "}
                                <span className="font-bold text-purple-600">
                                  {player2Moves}
                                </span>{" "}
                                zetten
                              </p>
                            </>
                          ) : raceWinner === 2 ? (
                            <>
                              <h3 className="text-4xl lg:text-5xl font-bold text-purple-600">
                                Speler 2 Wint! 🎉
                              </h3>
                              <p className="text-xl text-[#657575]">
                                Speler 2 heeft alle paren gevonden in{" "}
                                <span className="font-bold text-purple-600">
                                  {player2Moves}
                                </span>{" "}
                                zetten en{" "}
                                <span className="font-bold text-purple-600">
                                  {formatTime(player2Time)}
                                </span>
                                !
                              </p>
                              <p className="text-lg text-[#657575] mt-2">
                                Speler 1:{" "}
                                <span className="font-bold text-blue-600">
                                  {player1MatchedPairs.length}
                                </span>{" "}
                                paren gevonden in{" "}
                                <span className="font-bold text-blue-600">
                                  {player1Moves}
                                </span>{" "}
                                zetten
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-4xl lg:text-5xl font-bold text-yellow-600">
                                Gelijk Spel! 🤝
                              </h3>
                              <p className="text-xl text-[#657575]">
                                Beide spelers hebben alle paren gevonden!
                              </p>
                            </>
                          )}

                          <div className="flex gap-4 mt-6">
                            <motion.button
                              className="px-6 py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-2xl font-bold shadow-lg"
                              onClick={resetGame}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              🔄 Opnieuw Spelen
                            </motion.button>
                          </div>
                        </>
                      ) : (
                        /* Single Player Win Screen */
                        <>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <Trophy size={120} className="text-[#22c55e]" />
                          </motion.div>
                          <h3 className="text-4xl lg:text-5xl font-bold text-[#440f0f]">
                            Gefeliciteerd!
                          </h3>
                          <p className="text-xl lg:text-2xl text-[#657575]">
                            Je hebt alle paren gevonden in{" "}
                            <span className="font-bold text-[#22c55e]">
                              {moves}
                            </span>{" "}
                            zetten en{" "}
                            <span className="font-bold text-[#22c55e]">
                              {formatTime(timeElapsed)}
                            </span>
                            !
                          </p>

                          {savedRank ? (
                            <div className="text-center">
                              <p className="text-2xl text-green-600 font-bold mb-4">
                                🎉 Je staat op plaats #{savedRank}!
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4">
                              <motion.button
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setShowKeyboard(true)}
                                disabled={isSavingScore}
                                whileHover={
                                  !isSavingScore ? { scale: 1.05 } : {}
                                }
                                whileTap={!isSavingScore ? { scale: 0.95 } : {}}
                              >
                                {isSavingScore
                                  ? "⏳ Opslaan..."
                                  : "📝 Score Opslaan"}
                              </motion.button>
                              {saveError && (
                                <p className="text-red-500">{saveError}</p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-4 mt-4">
                            <motion.button
                              className="px-6 py-3 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-2xl font-bold shadow-lg"
                              onClick={resetGame}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              🔄 Opnieuw Spelen
                            </motion.button>
                            <motion.button
                              className="px-6 py-3 bg-white border-2 border-[#22c55e] text-[#22c55e] rounded-2xl font-bold shadow-lg"
                              onClick={() => setShowLeaderboard(true)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              🏆 Bekijk Scores
                            </motion.button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              ) : gameMode === 2 ? (
                /* Two Players Race Mode - Split Screen */
                <div className="flex flex-col lg:flex-row gap-4 h-full">
                  {/* Player 1 Board */}
                  <div className="flex-1 flex flex-col border-4 border-blue-500 rounded-2xl p-4 bg-blue-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-2xl font-bold ${
                          player1Won || raceWinner === 1
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      >
                        {player1Won || raceWinner === 1
                          ? "🏆 Speler 1 Wint!"
                          : "Speler 1"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold">
                          Zetten: {player1Moves}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {formatTime(player1Time)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="grid gap-2 flex-1"
                      style={{ gridTemplateColumns: `repeat(4, 1fr)` }}
                    >
                      {player1Cards.map(card => {
                        const flipped = isPlayer1CardFlipped(card.id)
                        const matched = flattenedPlayer1MatchedPairs.includes(
                          card.id
                        )
                        const canClick =
                          !flipped &&
                          player1FlippedCards.length < 2 &&
                          !player1Won &&
                          !raceWinner

                        return (
                          <motion.div
                            key={card.id}
                            className={`relative ${
                              canClick
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-60"
                            }`}
                            style={{ perspective: "1000px" }}
                            onClick={() =>
                              canClick && handlePlayer1CardClick(card.id)
                            }
                            whileHover={canClick ? { scale: 1.05 } : {}}
                            whileTap={canClick ? { scale: 0.95 } : {}}
                          >
                            <motion.div
                              className="w-full aspect-square relative"
                              initial={false}
                              animate={{ rotateY: flipped ? 180 : 0 }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                              style={{ transformStyle: "preserve-3d" }}
                            >
                              <div
                                className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center rounded-xl shadow-lg border-4 ${
                                  matched ? "border-blue-300" : "border-white"
                                }`}
                                style={{
                                  backfaceVisibility: "hidden",
                                  WebkitBackfaceVisibility: "hidden",
                                }}
                              >
                                <span className="text-4xl lg:text-5xl opacity-60">
                                  ❓
                                </span>
                              </div>
                              <div
                                className={`absolute inset-0 bg-white flex items-center justify-center rounded-xl shadow-lg border-4 ${
                                  matched
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-blue-500"
                                }`}
                                style={{
                                  backfaceVisibility: "hidden",
                                  WebkitBackfaceVisibility: "hidden",
                                  transform: "rotateY(180deg)",
                                }}
                              >
                                <span className="text-4xl lg:text-5xl">
                                  {card.image}
                                </span>
                              </div>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-2 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>

                  {/* Player 2 Board */}
                  <div className="flex-1 flex flex-col border-4 border-purple-500 rounded-2xl p-4 bg-purple-50/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-2xl font-bold ${
                          player2Won || raceWinner === 2
                            ? "text-yellow-600"
                            : "text-purple-600"
                        }`}
                      >
                        {player2Won || raceWinner === 2
                          ? "🏆 Speler 2 Wint!"
                          : "Speler 2"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-bold">
                          Zetten: {player2Moves}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {formatTime(player2Time)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="grid gap-2 flex-1"
                      style={{ gridTemplateColumns: `repeat(4, 1fr)` }}
                    >
                      {player2Cards.map(card => {
                        const flipped = isPlayer2CardFlipped(card.id)
                        const matched = flattenedPlayer2MatchedPairs.includes(
                          card.id
                        )
                        const canClick =
                          !flipped &&
                          player2FlippedCards.length < 2 &&
                          !player2Won &&
                          !raceWinner

                        return (
                          <motion.div
                            key={card.id}
                            className={`relative ${
                              canClick
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-60"
                            }`}
                            style={{ perspective: "1000px" }}
                            onClick={() =>
                              canClick && handlePlayer2CardClick(card.id)
                            }
                            whileHover={canClick ? { scale: 1.05 } : {}}
                            whileTap={canClick ? { scale: 0.95 } : {}}
                          >
                            <motion.div
                              className="w-full aspect-square relative"
                              initial={false}
                              animate={{ rotateY: flipped ? 180 : 0 }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                              style={{ transformStyle: "preserve-3d" }}
                            >
                              <div
                                className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center rounded-xl shadow-lg border-4 ${
                                  matched ? "border-purple-300" : "border-white"
                                }`}
                                style={{
                                  backfaceVisibility: "hidden",
                                  WebkitBackfaceVisibility: "hidden",
                                }}
                              >
                                <span className="text-4xl lg:text-5xl opacity-60">
                                  ❓
                                </span>
                              </div>
                              <div
                                className={`absolute inset-0 bg-white flex items-center justify-center rounded-xl shadow-lg border-4 ${
                                  matched
                                    ? "border-purple-400 bg-purple-50"
                                    : "border-purple-500"
                                }`}
                                style={{
                                  backfaceVisibility: "hidden",
                                  WebkitBackfaceVisibility: "hidden",
                                  transform: "rotateY(180deg)",
                                }}
                              >
                                <span className="text-4xl lg:text-5xl">
                                  {card.image}
                                </span>
                              </div>
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Player Game Board */
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                  {/* Cards Grid */}
                  <div
                    className="grid gap-4 lg:gap-5"
                    style={{ gridTemplateColumns: `repeat(4, 1fr)` }}
                  >
                    {cards.map(card => {
                      const flipped = isCardFlipped(card.id)
                      const matched = flattenedMatchedPairs.includes(card.id)
                      const canClick =
                        !flipped && flippedCards.length < 2 && !gameWon

                      return (
                        <motion.div
                          key={card.id}
                          className={`relative ${
                            canClick
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-60"
                          }`}
                          style={{ perspective: "1000px" }}
                          onClick={() => canClick && handleCardClick(card.id)}
                          whileHover={canClick ? { scale: 1.05 } : {}}
                          whileTap={canClick ? { scale: 0.95 } : {}}
                        >
                          <motion.div
                            className="w-24 h-24 lg:w-32 lg:h-32 relative"
                            initial={false}
                            animate={{ rotateY: flipped ? 180 : 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            {/* Card Back (question mark) - visible when not flipped */}
                            <div
                              className={`absolute inset-0 bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center rounded-2xl shadow-lg border-4 ${
                                matched ? "border-green-300" : "border-white"
                              }`}
                              style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                              }}
                            >
                              <span className="text-5xl lg:text-6xl opacity-60">
                                ❓
                              </span>
                            </div>

                            {/* Card Front (emoji) - visible when flipped */}
                            <div
                              className={`absolute inset-0 bg-white flex items-center justify-center rounded-2xl shadow-lg border-4 ${
                                matched
                                  ? "border-green-400 bg-green-50"
                                  : "border-[#22c55e]"
                              }`}
                              style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                              }}
                            >
                              <span className="text-5xl lg:text-7xl">
                                {card.image}
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Leaderboard */}
                  <div className="flex-shrink-0 w-72">
                    <div className="bg-white rounded-2xl shadow-lg p-5 border border-[#a7b8b4]/30">
                      <h3 className="text-lg font-bold text-[#440f0f] mb-4 flex items-center gap-2">
                        <Trophy size={20} className="text-[#22c55e]" />
                        Beste Scores
                      </h3>

                      {loadingScores ? (
                        <div className="text-center py-4 text-[#657575]">
                          Laden...
                        </div>
                      ) : scores.length === 0 ? (
                        <div className="text-center py-4 text-[#657575]">
                          Nog geen scores
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {scores.slice(0, 5).map((score, index) => (
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
                              <div className="text-right">
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
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-[#a7b8b4]/30 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#657575]">Jouw zetten:</span>
                          <span className="font-bold text-[#22c55e]">
                            {moves}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#657575]">Jouw tijd:</span>
                          <span className="font-bold text-[#22c55e]">
                            {formatTime(timeElapsed)}
                          </span>
                        </div>
                      </div>
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

export default MemoryGame
