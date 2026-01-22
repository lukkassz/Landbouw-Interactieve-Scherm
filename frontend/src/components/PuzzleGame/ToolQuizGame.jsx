/**
 * ToolQuizGame Component
 * 
 * Educational quiz game about agricultural tools and equipment.
 * Players guess the purpose of historical farming tools from images.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Trophy, CheckCircle2, XCircle, HelpCircle, ChevronRight, ArrowLeft } from "lucide-react"
import { getTheme } from "../../config/themes"
import { useSound } from "../../hooks/useSound"
import { preloadImages } from "../../hooks/useImagePreloader"
import { api } from "../../services/api"
import VirtualKeyboard from "../Common/VirtualKeyboard"

const ToolQuizGame = ({ isOpen, onClose, variant = "museum", eventId = null }) => {
  const theme = getTheme()
  const playSound = useSound()

  // Game state
  const [gameState, setGameState] = useState("menu") // menu, playing, answer, gameOver
  const [allQuestions, setAllQuestions] = useState([]) // Store all fetched questions
  const [questions, setQuestions] = useState([]) // Questions for current game
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState("easy") // easy, hard
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imagesPreloaded, setImagesPreloaded] = useState(false)

  // Leaderboard & Save
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [savedRank, setSavedRank] = useState(null)
  const [topScores, setTopScores] = useState([])
  const [loadingScores, setLoadingScores] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Theme styles
  const styles = useMemo(() => {
    // Normalize variant to ensure matching works
    const normalizedVariant = (variant || "museum").toLowerCase()
    
    switch (normalizedVariant) {
      case "landbouw":
        return {
          modalBg: "bg-[#f3eeda]",
          headerBg: "bg-[#7c8f38]",
          headerText: "text-[#f3eeda]",
          textPrimary: "text-[#3a2d20]",
          textSecondary: "text-[#6b5a45]",
          buttonPrimary: "bg-[#7c8f38] hover:bg-[#66752e] text-white shadow-md hover:shadow-lg",
          buttonCorrect: "bg-green-600 text-white border-2 border-green-700 shadow-md",
          buttonWrong: "bg-red-600 text-white border-2 border-red-700 shadow-md",
          buttonOption: "bg-[#e6dfc8] hover:bg-[#d1c7a7] text-[#3a2d20] border-2 border-[#d1c7a7] hover:border-[#b8ae91]",
        }
      case "newspaper":
      case "maatschappelijk":
        return {
          modalBg: "bg-[#f0f0f0]",
          headerBg: "bg-[#1a1a1a]",
          headerText: "text-[#f0f0f0] font-serif uppercase tracking-wider",
          textPrimary: "text-black font-serif",
          textSecondary: "text-gray-600 font-serif",
          buttonPrimary: "bg-[#1a1a1a] hover:bg-black text-white shadow-md hover:shadow-lg",
          buttonCorrect: "bg-green-700 text-white border-2 border-green-800 shadow-md",
          buttonWrong: "bg-red-700 text-white border-2 border-red-800 shadow-md",
          buttonOption: "bg-white hover:bg-gray-100 text-black border-2 border-gray-300 hover:border-black",
        }
      case "museum":
      default:
        return {
          modalBg: "bg-[#f3f2e9]", // Linen (MUSEUM_COLORS.linen)
          headerBg: "bg-[#440f0f]", // Maroon (MUSEUM_COLORS.maroon) - More premium than gold
          headerText: "text-[#f3f2e9] font-heading tracking-wide", // Linen text
          textPrimary: "text-[#440f0f] font-heading", // Maroon text
          textSecondary: "text-[#657575] font-body", // Slate text
          buttonPrimary: "bg-gradient-to-br from-[#c9a300] to-[#ae5514] hover:from-[#b48a0f] hover:to-[#89350a] text-white shadow-md hover:shadow-lg border border-[#c9a300]/20", // Gold -> Terracotta
          buttonCorrect: "bg-green-600 text-white border-2 border-green-700 shadow-md", // Standard Green for clarity
          buttonWrong: "bg-red-600 text-white border-2 border-red-700 shadow-md", // Standard Red for clarity
          buttonOption: "bg-white hover:bg-[#f3f2e9] text-[#440f0f] border-2 border-[#a7b8b4]/30 hover:border-[#c9a300] shadow-sm hover:shadow-md font-body",
        }
    }
  }, [variant])

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    setImagesPreloaded(false)
    try {
      const result = await api.getQuizQuestions(eventId)
      if (result.success && result.questions && result.questions.length > 0) {
        setAllQuestions(result.questions)
        
        // Preload all question images immediately for smooth gameplay
        const imageUrls = result.questions
          .map(q => q.image_url)
          .filter(url => url && url.trim() !== '')
        
        if (imageUrls.length > 0) {
          // Preload with high priority and high concurrency for quiz
          // Don't await - let it run in background but start immediately
          preloadImages(imageUrls, { concurrency: 10, lowPriority: false })
            .then(() => {
              setImagesPreloaded(true)
            })
        } else {
          setImagesPreloaded(true)
        }
      } else {
        setError("Geen vragen beschikbaar")
      }
    } catch (err) {
      console.error("Failed to fetch quiz questions:", err)
      setError("Kon vragen niet laden")
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // Fetch leaderboard (filtered by eventId and difficulty)
  const fetchScores = useCallback(async (difficultyToFetch = null) => {
    setLoadingScores(true)
    try {
      const result = await api.getQuizScores(eventId, difficultyToFetch || difficulty)
      if (result.success) {
        setTopScores(result.scores || [])
      }
    } catch (err) {
      console.error("Failed to fetch scores:", err)
    } finally {
      setLoadingScores(false)
    }
  }, [eventId, difficulty])

  // Load questions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
      // Don't fetch scores on initial load - fetch when difficulty is selected
    }
  }, [isOpen, fetchQuestions])

  // Start game
  const startGame = useCallback((selectedDifficulty) => {
    setDifficulty(selectedDifficulty)
    
    // Fetch scores for the selected difficulty
    fetchScores(selectedDifficulty)
    
    // Filter questions by difficulty
    const filtered = allQuestions.filter(q => {
      if (selectedDifficulty === 'easy') {
        return !q.difficulty || q.difficulty === 'easy'
      }
      return q.difficulty === 'hard'
    })

    // Fallback if not enough questions for selected difficulty
    let gameQuestions = filtered
    if (filtered.length < 5) {
        // If hard has too few, mix in some easy ones or vice versa to ensure playable game
        // For now, just use what we have or fallback to all if empty
        if (filtered.length === 0) gameQuestions = allQuestions
    }

    // Shuffle and slice
    const shuffled = [...gameQuestions].sort(() => Math.random() - 0.5)
    setQuestions(shuffled.slice(0, 10))

    setGameState("playing")
    setCurrentQuestionIndex(0)
    setScore(0)
    setAnsweredQuestions([])
    setSelectedAnswer(null)
    setSaveError("")
  }, [allQuestions, fetchScores])

  // Handle answer selection
  const handleAnswerSelect = useCallback((answer) => {
    if (gameState !== "playing") return

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setGameState("answer")

    if (correct) {
      setScore(prev => prev + 1)
      playSound()
    }

    // Record answer
    setAnsweredQuestions(prev => [...prev, {
      question: currentQuestion.question,
      selected: answer,
      correct: currentQuestion.correct_answer,
      isCorrect: correct
    }])
  }, [gameState, currentQuestion, playSound])

  // Next question
  const nextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setGameState("gameOver")
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setGameState("playing")
    }
  }, [isLastQuestion])

  // Reset game
  const resetGame = useCallback(() => {
    setGameState("menu")
    setCurrentQuestionIndex(0)
    setScore(0)
    setAnsweredQuestions([])
    setSelectedAnswer(null)
    setSavedRank(null)
    setShowLeaderboard(false)
    setSaveError("")
  }, [])

  // Save score (with eventId and difficulty)
  const handleSaveScore = useCallback(async (playerName) => {
    setSaveError("")
    try {
      const result = await api.saveQuizScore(playerName, score, totalQuestions, eventId, difficulty)
      if (result.success) {
        setSavedRank(result.rank)
        fetchScores()
        setShowKeyboard(false)
      } else {
        setSaveError(result.message || "Kon score niet opslaan")
      }
    } catch (err) {
      console.error("Failed to save score:", err)
      setSaveError("Kon score niet opslaan. Probeer opnieuw.")
    }
  }, [score, totalQuestions, eventId, difficulty, fetchScores])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className={`relative ${styles.modalBg} rounded-3xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden`}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 ${styles.headerBg} shadow-md z-10 shrink-0`}>
              <div className="flex items-center gap-3">
                {(gameState === "playing" || gameState === "answer") ? (
                    <button 
                        onClick={resetGame}
                        className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors text-white"
                        title="Terug naar menu"
                    >
                        <ArrowLeft size={24} />
                    </button>
                ) : (
                    <div className="bg-white/20 p-2 rounded-full">
                        <HelpCircle size={24} className="text-white" />
                    </div>
                )}
                <h2 className={`text-xl md:text-2xl font-bold ${styles.headerText}`}>
                  {variant === "newspaper" ? "QUIZ" : "Kennisquiz"}
                </h2>
              </div>

              {(gameState === "playing" || gameState === "answer") && (
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-medium opacity-90">Vraag</span>
                    <span className="ml-2 font-bold text-white">{currentQuestionIndex + 1}/{totalQuestions}</span>
                  </div>
                  <div className="hidden sm:flex bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-medium opacity-90">Score</span>
                    <span className="ml-2 font-bold text-yellow-300">{score}</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scrollbar-hide flex flex-col h-full">
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
              `}</style>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="animate-spin w-12 h-12 border-4 border-[#c9a300] border-t-transparent rounded-full" />
                  <p className="text-gray-500 font-medium">Vragen laden...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <XCircle size={64} className="text-red-500 opacity-80" />
                  <p className="text-xl text-red-500 font-medium">{error}</p>
                  <button onClick={onClose} className={`px-6 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}>
                    Sluiten
                  </button>
                </div>
              ) : showLeaderboard ? (
                /* Leaderboard View - Full Screen */
                <div className="flex flex-col items-center justify-center h-full p-6 w-full">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 border border-[#a7b8b4]/30 flex flex-col h-full max-h-[700px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-[#440f0f] flex items-center gap-3">
                          <Trophy size={32} className="text-[#c9a300]" />
                          Beste Scores ({difficulty === 'easy' ? 'Makkelijk' : 'Moeilijk'})
                        </h3>
                        <button 
                            onClick={() => setShowLeaderboard(false)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={24} className="text-gray-500" />
                        </button>
                      </div>
                      
                      {/* Difficulty Toggle */}
                      <div className="flex gap-2 mb-6">
                        <button
                          onClick={() => {
                            setDifficulty('easy');
                            fetchScores('easy');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                            difficulty === 'easy'
                              ? 'bg-green-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Makkelijk
                        </button>
                        <button
                          onClick={() => {
                            setDifficulty('hard');
                            fetchScores('hard');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                            difficulty === 'hard'
                              ? 'bg-red-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Moeilijk
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {loadingScores ? (
                          <div className="text-center py-12 text-[#657575] text-lg">
                            Scores laden...
                          </div>
                        ) : topScores.length === 0 ? (
                          <div className="text-center py-12 text-[#657575] text-lg">
                            Nog geen scores voor dit niveau.
                          </div>
                        ) : (
                          topScores.slice(0, 50).map((score, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-4 rounded-xl transition-transform hover:scale-[1.01] ${
                                index === 0
                                  ? "bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-2 border-yellow-300 shadow-md"
                                  : index === 1
                                  ? "bg-gradient-to-r from-gray-50 to-gray-100/50 border-2 border-gray-300 shadow-sm"
                                  : index === 2
                                  ? "bg-gradient-to-r from-orange-50 to-orange-100/50 border-2 border-orange-300 shadow-sm"
                                  : index % 2 === 0 ? "bg-gray-50" : "bg-white border border-gray-100"
                              } ${score.rank === savedRank ? "ring-2 ring-green-500 bg-green-50" : ""}`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-2xl">
                                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""}
                                </span>
                                {index > 2 && (
                                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 font-bold text-lg text-gray-500">
                                    {index + 1}
                                  </div>
                                )}
                                <span className={`font-bold text-lg ${index < 3 ? "text-[#440f0f]" : "text-gray-700"}`}>
                                  {score.player_name}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold text-xl ${
                                    index === 0 ? "text-yellow-600" :
                                    index === 1 ? "text-gray-500" :
                                    index === 2 ? "text-orange-500" :
                                    "text-[#657575]"
                                }`}>
                                  {score.score}/{score.total_questions || totalQuestions}
                                </span>
                                <span className="text-sm text-gray-400 ml-1">punten</span>
                              </div>
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
                            onClick={() => setShowLeaderboard(false)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Terug
                        </motion.button>
                      </div>
                    </div>
                </div>
              ) : gameState === "menu" ? (
                /* Menu Screen */
                <div className="flex flex-col items-center justify-center h-full gap-8 md:gap-12 py-8 px-4 relative">
                  {/* Decorative background element for museum theme */}
                  {variant === "museum" && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
                       <Trophy size={400} />
                    </div>
                  )}

                  <div className="text-center max-w-3xl space-y-6 md:space-y-8 z-10">
                    <h3 className={`text-3xl md:text-5xl lg:text-6xl font-bold ${styles.textPrimary} tracking-tight`}>
                      Test je kennis!
                    </h3>
                    <p className={`text-lg md:text-xl lg:text-2xl ${styles.textSecondary} leading-relaxed max-w-2xl mx-auto font-light`}>
                      Weet jij alles over de geschiedenis van de landbouw? Doe mee en win een plek op het scorebord!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl z-10">
                    <div className={`bg-white p-6 md:p-8 rounded-2xl border-2 ${variant === 'museum' ? 'border-[#a7b8b4]/30' : 'border-[#c9a300]/20'} shadow-sm flex items-center gap-5 transition-transform hover:scale-105 duration-300`}>
                      <div className={`p-4 rounded-full ${variant === 'museum' ? 'bg-[#f3f2e9]' : 'bg-green-100'}`}>
                        <CheckCircle2 size={32} className={`${variant === 'museum' ? 'text-[#929d7c]' : 'text-green-600'}`} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={`text-2xl md:text-3xl font-bold ${styles.textPrimary}`}>
                          {totalQuestions}
                        </span>
                        <span className={`text-sm md:text-base ${styles.textSecondary} uppercase tracking-wider font-semibold`}>
                          Vragen
                        </span>
                      </div>
                    </div>
                    <button 
                        onClick={() => {
                            // Show scores for 'easy' by default in menu
                            setDifficulty('easy');
                            fetchScores('easy');
                            setShowLeaderboard(true);
                        }}
                        className={`bg-white p-6 md:p-8 rounded-2xl border-2 ${variant === 'museum' ? 'border-[#a7b8b4]/30' : 'border-[#c9a300]/20'} shadow-sm flex items-center gap-5 transition-transform hover:scale-105 duration-300 w-full text-left`}
                    >
                      <div className={`p-4 rounded-full ${variant === 'museum' ? 'bg-[#f3f2e9]' : 'bg-yellow-100'}`}>
                        <Trophy size={32} className={`${variant === 'museum' ? 'text-[#c9a300]' : 'text-yellow-600'}`} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className={`text-2xl md:text-3xl font-bold ${styles.textPrimary}`}>
                          Scores
                        </span>
                        <span className={`text-sm md:text-base ${styles.textSecondary} uppercase tracking-wider font-semibold`}>
                          Bekijken
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl z-10 mt-4">
                    <motion.button
                      className={`group relative flex-1 px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transition-all bg-green-600 text-white hover:bg-green-700`}
                      onClick={() => startGame('easy')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-2">
                            Makkelijk
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <span className="text-sm font-normal opacity-90">Voor beginners</span>
                      </span>
                    </motion.button>

                    <motion.button
                      className={`group relative flex-1 px-6 py-5 rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transition-all bg-red-600 text-white hover:bg-red-700`}
                      onClick={() => startGame('hard')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-2">
                            Moeilijk
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <span className="text-sm font-normal opacity-90">Voor experts</span>
                      </span>
                    </motion.button>
                  </div>
                  
                  {/* Image preloading indicator */}
                  {!imagesPreloaded && (
                    <motion.div 
                      className="z-10 flex items-center gap-2 text-sm text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <span>Afbeeldingen laden...</span>
                    </motion.div>
                  )}
                </div>
              ) : gameState === "playing" || gameState === "answer" ? (
                /* Question Screen */
                <div className="flex flex-col lg:flex-row-reverse min-[2000px]:flex-col items-center justify-center h-full w-full max-w-7xl min-[2000px]:max-w-[95vw] mx-auto gap-6 lg:gap-8 min-[2000px]:gap-12 px-4">
                  {/* Right Section: Image (on Laptop) / Top Section: Image (on Mobile/4K) */}
                  <div className="w-full lg:w-1/3 min-[2000px]:w-[75%] flex-shrink-0 flex items-center justify-center h-48 md:h-64 lg:h-full min-[2000px]:h-auto min-[2000px]:flex-shrink-1">
                     <div className="w-full h-full max-h-[35vh] lg:max-h-[60vh] min-[2000px]:max-h-[45vh] aspect-video lg:aspect-auto min-[2000px]:aspect-video relative group rounded-2xl overflow-hidden shadow-md border-2 border-white/50 bg-gray-50">
                      <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gray-100">
                        {currentQuestion.image_url ? (
                          <>
                              {/* Blurred Background for fill */}
                              <div 
                                  className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 scale-110 transition-transform duration-700 group-hover:scale-125"
                                  style={{ backgroundImage: `url(${currentQuestion.image_url})` }}
                              />
                              {/* Overlay to dampen background */}
                              <div className="absolute inset-0 bg-black/5" />
                              
                              {/* Main Image */}
                              <img
                                src={currentQuestion.image_url}
                                alt="Quiz vraag"
                                className="relative z-10 max-w-full max-h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105 drop-shadow-xl"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.querySelector('.image-error-fallback').style.display = 'flex';
                                }}
                              />
                              {/* Fallback if image fails to load */}
                              <div className="image-error-fallback absolute inset-0 hidden flex-col items-center justify-center gap-3 text-gray-300 z-0">
                                <HelpCircle size={64} className="opacity-50" />
                                <span className="text-sm font-medium">Afbeelding niet geladen</span>
                              </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 text-gray-300 h-full w-full">
                            <HelpCircle size={64} className="opacity-50" />
                            <span className="text-sm font-medium">Geen afbeelding</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wide z-20">
                        Vraag {currentQuestionIndex + 1}
                      </div>
                    </div>
                  </div>

                  {/* Left Section: Content (on Laptop) / Bottom Section: Content (on Mobile/4K) */}
                  <div className="flex flex-col flex-1 w-full min-[2000px]:w-[75%] lg:h-full justify-center min-w-0">
                    {/* Question Text */}
                    <div className="w-full text-center lg:text-left min-[2000px]:text-center mb-6 flex-shrink-0">
                      <h3 className={`text-lg md:text-2xl lg:text-3xl min-[2000px]:text-5xl font-bold leading-tight ${styles.textPrimary}`}>
                        {currentQuestion.question}
                      </h3>
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-[2000px]:gap-6 w-full mb-6 flex-grow overflow-y-auto scrollbar-hide min-h-[100px]">
                      {[
                        currentQuestion.option_1,
                        currentQuestion.option_2,
                        currentQuestion.option_3,
                        currentQuestion.option_4
                      ].filter(Boolean).map((option, index) => {
                        const isSelected = selectedAnswer === option
                        const isCorrectAnswer = option === currentQuestion.correct_answer
                        const showFeedback = gameState === "answer"

                        let buttonStyle = styles.buttonOption
                        let icon = <div className="w-8 h-8 rounded-full border-2 border-current opacity-30 flex items-center justify-center font-bold text-sm">{String.fromCharCode(65 + index)}</div>
                        
                        if (showFeedback) {
                          if (isSelected && isCorrect) {
                            buttonStyle = styles.buttonCorrect
                            icon = <CheckCircle2 size={28} className="text-white" />
                          } else if (isSelected && !isCorrect) {
                            buttonStyle = styles.buttonWrong
                            icon = <XCircle size={28} className="text-white" />
                          } else if (isCorrectAnswer) {
                            buttonStyle = styles.buttonCorrect
                            icon = <CheckCircle2 size={28} className="text-white" />
                          }
                        } else if (isSelected) {
                          buttonStyle = "bg-[#c9a300] text-white border-2 border-[#b89300]"
                          icon = <div className="w-8 h-8 rounded-full bg-white text-[#c9a300] flex items-center justify-center font-bold text-sm">✓</div>
                        }

                        return (
                          <motion.button
                            key={index}
                            className={`relative p-4 min-[2000px]:p-8 rounded-xl font-bold text-lg min-[2000px]:text-3xl text-left transition-all ${buttonStyle} ${
                              gameState === "answer" ? "cursor-default opacity-90" : "active:scale-[0.98]"
                            } flex items-center gap-4 group min-h-[80px] min-[2000px]:min-h-[140px]`}
                            onClick={() => handleAnswerSelect(option)}
                            disabled={gameState === "answer"}
                            whileHover={gameState === "playing" ? { y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } : {}}
                          >
                            <div className="shrink-0 min-[2000px]:scale-150">
                              {icon}
                            </div>
                            <span className="leading-snug flex-1">{option}</span>
                          </motion.button>
                        )
                      })}
                    </div>

                    {/* Next Button */}
                    {gameState === "answer" && (
                      <motion.div 
                        className="flex justify-center lg:justify-start min-[2000px]:justify-center w-full pb-4 flex-shrink-0"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <button
                          className={`px-10 py-4 min-[2000px]:px-16 min-[2000px]:py-6 rounded-2xl font-bold text-xl min-[2000px]:text-3xl shadow-lg hover:shadow-xl transition-all ${styles.buttonPrimary} flex items-center gap-3`}
                          onClick={nextQuestion}
                        >
                          {isLastQuestion ? "Bekijk Resultaten" : "Volgende Vraag"}
                          <ChevronRight className="min-[2000px]:scale-150" />
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : gameState === "gameOver" ? (
                /* Game Over Screen */
                <div className="flex flex-col items-center justify-center h-full gap-8 py-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 rounded-full"></div>
                    <Trophy size={120} className="text-[#c9a300] relative z-10 drop-shadow-sm" />
                  </motion.div>

                  <div className="text-center space-y-2">
                    <h3 className={`text-4xl lg:text-5xl font-bold ${styles.textPrimary}`}>
                      Quiz Voltooid!
                    </h3>
                    <p className={`text-xl ${styles.textSecondary}`}>
                      Bedankt voor het spelen
                    </p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border-2 border-[#c9a300]/20 shadow-lg text-center min-w-[300px]">
                    <p className={`text-lg uppercase tracking-widest text-gray-400 font-bold mb-2`}>
                      Je score
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-7xl font-black text-[#c9a300]">{score}</span>
                        <span className="text-4xl font-bold text-gray-300">/{totalQuestions}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            className="h-full bg-[#c9a300]" 
                            initial={{ width: 0 }}
                            animate={{ width: `${(score / totalQuestions) * 100}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                        />
                    </div>
                    <p className={`text-lg font-medium ${styles.textPrimary}`}>
                      {score === totalQuestions ? "Perfect! Een echte expert! 🎉" : 
                       score >= totalQuestions * 0.7 ? "Geweldig gedaan! 👏" :
                       score >= totalQuestions * 0.5 ? "Goed geprobeerd! 👍" :
                       "Volgende keer beter! 💪"}
                    </p>
                  </div>

                  {savedRank ? (
                    <div className="text-center animate-fade-in flex flex-col items-center">
                      <p className="text-2xl text-green-600 font-bold mb-4">
                        Je staat op plaats #{savedRank}!
                      </p>
                      <div className="flex gap-4">
                        <motion.button
                          className={`px-6 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}
                          onClick={resetGame}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Opnieuw Spelen
                        </motion.button>
                        
                        <motion.button
                            className="px-6 py-3 bg-white border-2 border-[#c9a300] text-[#c9a300] rounded-xl font-bold shadow-lg flex items-center gap-2"
                            onClick={() => {
                                setShowLeaderboard(true);
                                fetchScores(difficulty);
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
                    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                      <motion.button
                        className={`w-full px-8 py-4 rounded-2xl font-bold text-lg shadow-lg ${styles.buttonCorrect} flex items-center justify-center gap-2`}
                        onClick={() => setShowKeyboard(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CheckCircle2 size={20} />
                        Score Opslaan
                      </motion.button>
                      {saveError && (
                        <p className="text-red-500 text-sm text-center">{saveError}</p>
                      )}
                      <motion.button
                        className={`w-full px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors`}
                        onClick={resetGame}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Niet opslaan, opnieuw spelen
                      </motion.button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Virtual Keyboard */}
          <VirtualKeyboard
            isOpen={showKeyboard}
            onClose={() => setShowKeyboard(false)}
            onSubmit={handleSaveScore}
            maxLength={10}
            title="Voer je naam in"
            placeholder="Bijv. Jan"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ToolQuizGame
