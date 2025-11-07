import React from "react"
import { motion } from "framer-motion"

/**
 * IdleScreen Component
 * 
 * Displays a screensaver mode with:
 * - Fullscreen video background (no dimming)
 * - Centered glassmorphism box with call-to-action
 * - Pulsing animation
 */
const IdleScreen = ({ onActivate }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 1 }}
      onClick={onActivate}
      onTouchStart={onActivate}
      style={{ pointerEvents: "auto" }}
    >
      {/* Glassmorphism Box */}
      <motion.div
        className="max-w-2xl w-full mx-4 p-12 bg-white/10 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: [1, 1.05, 1]
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          opacity: { duration: 1 },
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        {/* Icon */}
        <motion.div
          className="text-8xl mb-6 text-white"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          🌾
        </motion.div>

        {/* Main Text - Glass effect on letters */}
        <motion.h1
          className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 4px rgba(255, 255, 255, 0.3))",
          }}
        >
          Raak me aan
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-2xl font-medium text-white/80"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Ontdek 100 jaar Fries Landbouwmuseum
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

export default IdleScreen

