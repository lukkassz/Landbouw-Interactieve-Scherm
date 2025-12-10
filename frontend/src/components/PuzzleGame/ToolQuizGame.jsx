/**
 * ToolQuizGame Component - "Wat is dit werktuig?"
 * 
 * Educational quiz game about agricultural tools and equipment.
 * Players guess the purpose of historical farming tools from images.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, RotateCcw, Trophy, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
import { getTheme } from "../../config/themes"
import { useSound } from "../../hooks/useSound"
import { api } from "../../services/api"
import VirtualKeyboard from "../Common/VirtualKeyboard"

const ToolQuizGame = ({ isOpen, onClose, variant = "museum", eventId = null }) => {
  const theme = getTheme()
  const playSound = useSound()

  // Game state
  const [gameState, setGameState] = useState("menu") // menu, playing, answer, gameOver
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Leaderboard & Save
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [savedRank, setSavedRank] = useState(null)
  const [topScores, setTopScores] = useState([])
  const [loadingScores, setLoadingScores] = useState(false)

  // Theme styles
  const styles = useMemo(() => {
    switch (variant) {
      case "landbouw":
        return {
          modalBg: "bg-[#f3eeda]",
          headerBg: "bg-[#7c8f38]",
          headerText: "text-[#f3eeda]",
          textPrimary: "text-[#3a2d20]",
          textSecondary: "text-[#6b5a45]",
          buttonPrimary: "bg-[#7c8f38] hover:bg-[#66752e] text-white",
          buttonCorrect: "bg-green-600 hover:bg-green-700 text-white",
          buttonWrong: "bg-red-600 hover:bg-red-700 text-white",
          buttonOption: "bg-[#e6dfc8] hover:bg-[#d1c7a7] text-[#3a2d20] border-2 border-[#d1c7a7]",
        }
      case "newspaper":
      case "maatschappelijk":
        return {
          modalBg: "bg-[#f0f0f0]",
          headerBg: "bg-[#1a1a1a]",
          headerText: "text-[#f0f0f0] font-serif uppercase",
          textPrimary: "text-black font-serif",
          textSecondary: "text-gray-600 font-serif",
          buttonPrimary: "bg-[#1a1a1a] hover:bg-black text-white",
          buttonCorrect: "bg-green-700 hover:bg-green-800 text-white",
          buttonWrong: "bg-red-700 hover:bg-red-800 text-white",
          buttonOption: "bg-white hover:bg-gray-100 text-black border-2 border-black",
        }
      case "museum":
      default:
        return {
          modalBg: "bg-[#f3f2e9]",
          headerBg: "bg-gradient-to-r from-[#c9a300] to-[#a68600]",
          headerText: "text-white font-heading",
          textPrimary: "text-[#440f0f]",
          textSecondary: "text-[#657575]",
          buttonPrimary: "bg-gradient-to-br from-[#c9a300] to-[#a68600] hover:from-[#b89300] hover:to-[#8a6d00] text-white",
          buttonCorrect: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white",
          buttonWrong: "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white",
          buttonOption: "bg-white hover:bg-[#f9f7f0] text-[#440f0f] border-2 border-[#a7b8b4]/30",
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
    try {
      const result = await api.getQuizQuestions(eventId)
      if (result.success && result.questions && result.questions.length > 0) {
        // Shuffle questions for variety
        const shuffled = [...result.questions].sort(() => Math.random() - 0.5)
        setQuestions(shuffled.slice(0, 10)) // Take 10 random questions
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

  // Fetch leaderboard
  const fetchScores = useCallback(async () => {
    setLoadingScores(true)
    try {
      const result = await api.getQuizScores()
      if (result.success) {
        setTopScores(result.scores || [])
      }
    } catch (err) {
      console.error("Failed to fetch scores:", err)
    } finally {
      setLoadingScores(false)
    }
  }, [])

  // Load questions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
      fetchScores()
    }
  }, [isOpen, fetchQuestions, fetchScores])

  // Start game
  const startGame = useCallback(() => {
    setGameState("playing")
    setCurrentQuestionIndex(0)
    setScore(0)
    setAnsweredQuestions([])
    setSelectedAnswer(null)
  }, [])

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
  }, [])

  // Save score
  const handleSaveScore = useCallback(async (playerName) => {
    try {
      const result = await api.saveQuizScore(playerName, score, totalQuestions)
      if (result.success) {
        setSavedRank(result.rank)
        fetchScores()
        setShowKeyboard(false)
      }
    } catch (err) {
      console.error("Failed to save score:", err)
    }
  }, [score, totalQuestions, fetchScores])

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
            className={`relative ${styles.modalBg} rounded-3xl shadow-2xl w-[95vw] max-w-5xl h-[90vh] flex flex-col overflow-hidden`}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-5 ${styles.headerBg} shadow-md`}>
              <div className="flex items-center gap-3">
                <HelpCircle size={32} className="text-white" />
                <h2 className={`text-2xl lg:text-3xl font-bold ${styles.headerText}`}>
                  {variant === "newspaper" ? "WAT IS DIT WERKTUIG?" : "Wat is dit werktuig?"}
                </h2>
              </div>

              {(gameState === "playing" || gameState === "answer") && (
                <div className="flex items-center gap-4 text-white">
                  <div className="bg-white/20 px-4 py-2 rounded-xl">
                    <span className="text-sm opacity-80">Pytanie:</span>
                    <span className="ml-2 font-bold">{currentQuestionIndex + 1}/{totalQuestions}</span>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-xl">
                    <span className="text-sm opacity-80">Poprawne:</span>
                    <span className="ml-2 font-bold text-green-300">{score}</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 lg:p-8">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-16 h-16 border-4 border-[#c9a300] border-t-transparent rounded-full" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <XCircle size={64} className="text-red-500" />
                  <p className="text-xl text-red-500">{error}</p>
                  <button onClick={onClose} className={`px-6 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}>
                    Sluiten
                  </button>
                </div>
              ) : gameState === "menu" ? (
                /* Menu Screen */
                <div className="flex flex-col items-center justify-center h-full gap-8">
                  <div className="text-center max-w-2xl">
                    <h3 className={`text-4xl lg:text-5xl font-bold mb-4 ${styles.textPrimary}`}>
                      Test je kennis!
                    </h3>
                    <p className={`text-xl ${styles.textSecondary}`}>
                      Herken je deze oude landbouwwerktuigen? Kies het juiste antwoord uit 3 opties.
                    </p>
                  </div>

                  <div className={`bg-white/50 p-6 rounded-2xl border-2 border-[#c9a300]/30`}>
                    <div className="flex items-center gap-4 mb-3">
                      <CheckCircle2 size={24} className="text-green-600" />
                      <span className={`text-lg ${styles.textPrimary}`}>
                        {totalQuestions} vragen
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Trophy size={24} className="text-yellow-600" />
                      <span className={`text-lg ${styles.textPrimary}`}>
                        Punten voor elke goede antwoord
                      </span>
                    </div>
                  </div>

                  <motion.button
                    className={`px-12 py-4 rounded-2xl font-bold text-xl shadow-lg ${styles.buttonPrimary}`}
                    onClick={startGame}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Quiz
                  </motion.button>
                </div>
              ) : gameState === "playing" || gameState === "answer" ? (
                /* Question Screen */
                <div className="flex flex-col items-center h-full gap-6">
                  {/* Question Image */}
                  <div className="w-full max-w-2xl aspect-video bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-[#c9a300]/20">
                    {currentQuestion.image_url ? (
                      <img
                        src={currentQuestion.image_url}
                        alt="Narzędzie"
                        className="w-full h-full object-contain bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <HelpCircle size={80} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <h3 className={`text-2xl lg:text-3xl font-bold text-center ${styles.textPrimary}`}>
                    {currentQuestion.question || "Waarvoor werd dit werktuig gebruikt?"}
                  </h3>

                  {/* Answer Options */}
                  <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
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
                      if (showFeedback) {
                        if (isSelected && isCorrect) {
                          buttonStyle = styles.buttonCorrect
                        } else if (isSelected && !isCorrect) {
                          buttonStyle = styles.buttonWrong
                        } else if (isCorrectAnswer) {
                          buttonStyle = styles.buttonCorrect
                        }
                      }

                      return (
                        <motion.button
                          key={index}
                          className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md transition-all ${buttonStyle} ${
                            gameState === "answer" ? "cursor-default" : ""
                          }`}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={gameState === "answer"}
                          whileHover={gameState === "playing" ? { scale: 1.02, x: 5 } : {}}
                          whileTap={gameState === "playing" ? { scale: 0.98 } : {}}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {showFeedback && isCorrectAnswer && (
                              <CheckCircle2 size={24} className="text-white" />
                            )}
                            {showFeedback && isSelected && !isCorrect && (
                              <XCircle size={24} className="text-white" />
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  {gameState === "answer" && (
                    <motion.button
                      className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg ${styles.buttonPrimary} mt-4`}
                      onClick={nextQuestion}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLastQuestion ? "Bekijk Resultaten" : "Volgende Vraag"}
                    </motion.button>
                  )}
                </div>
              ) : gameState === "gameOver" ? (
                /* Game Over Screen */
                <div className="flex flex-col items-center justify-center h-full gap-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Trophy size={100} className="text-[#c9a300]" />
                  </motion.div>

                  <h3 className={`text-4xl lg:text-5xl font-bold ${styles.textPrimary}`}>
                    Quiz Voltooid!
                  </h3>

                  <div className="text-center">
                    <p className={`text-2xl ${styles.textSecondary} mb-2`}>
                      Je score:
                    </p>
                    <p className="text-6xl font-bold text-[#c9a300]">
                      {score}/{totalQuestions}
                    </p>
                    <p className={`text-xl mt-2 ${styles.textSecondary}`}>
                      {score === totalQuestions ? "Perfect! 🎉" : 
                       score >= totalQuestions * 0.7 ? "Geweldig gedaan! 👏" :
                       score >= totalQuestions * 0.5 ? "Goed geprobeerd! 👍" :
                       "Probeer het nog eens! 💪"}
                    </p>
                  </div>

                  {savedRank ? (
                    <div className="text-center">
                      <p className="text-2xl text-green-600 font-bold mb-4">
                        Je staat op plaats #{savedRank}!
                      </p>
                      <div className="flex gap-4">
                        <motion.button
                          className={`px-8 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}
                          onClick={resetGame}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Opnieuw Spelen
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <motion.button
                        className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg ${styles.buttonCorrect}`}
                        onClick={() => setShowKeyboard(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Score Opslaan
                      </motion.button>
                      <div className="flex gap-4">
                        <motion.button
                          className={`px-6 py-3 rounded-xl font-bold ${styles.buttonPrimary}`}
                          onClick={resetGame}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Opnieuw Spelen
                        </motion.button>
                      </div>
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

