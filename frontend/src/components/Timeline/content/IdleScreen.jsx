import React, { useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import idleScreenVideo from "../../../assets/video/idle_screen.mp4"
import clickIcon from "../../../assets/icons/finger_click.png"

/**
 * Floating Particle Component
 * Creates glowing particles that float upward
 */
const FloatingParticle = ({ delay, duration, startX, size, color }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: `${startX}%`,
      bottom: "-20px",
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}`,
    }}
    initial={{ y: 0, opacity: 0, scale: 0 }}
    animate={{
      y: [0, -800, -1200],
      opacity: [0, 1, 1, 0],
      scale: [0, 1, 1.2, 0.5],
      x: [0, Math.random() * 100 - 50, Math.random() * 150 - 75],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
)

/**
 * Shimmer Text Effect
 * Animated gradient that moves across text
 */
const ShimmerText = ({ children, className }) => (
  <motion.span
    className={`relative inline-block ${className}`}
    style={{
      background: "linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 40%, #FFD700 50%, #FFFFFF 60%, #FFFFFF 100%)",
      backgroundSize: "200% 100%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: "0 2px 10px rgba(0,0,0,0.2)"
    }}
    animate={{
      backgroundPosition: ["200% 0%", "-200% 0%"],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    {children}
  </motion.span>
)

/**
 * Animated Border Glow
 */
const GlowingBorder = ({ children }) => (
  <div className="relative">
    {/* Animated gradient border */}
    <motion.div
      className="absolute -inset-px rounded-3xl opacity-40 blur-sm"
      style={{
        background: "linear-gradient(45deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1), rgba(255,255,255,0.6))",
        backgroundSize: "400% 400%",
      }}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      }}
    />
    {/* Inner content */}
    <div className="relative">{children}</div>
  </div>
)

/**
 * Touch Indicator with ripple effect
 */
const TouchIndicator = () => (
  <motion.div
    className="flex flex-col items-center gap-4 mt-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.2, duration: 0.8 }}
  >
    {/* Hand icon with tap animation */}
    <motion.div
      className="relative"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Ripple effects */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/50"
        style={{ width: 80, height: 80, marginLeft: -15, marginTop: -15 }}
        animate={{ scale: [1, 1.5, 1.5], opacity: [0.8, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/50"
        style={{ width: 80, height: 80, marginLeft: -15, marginTop: -15 }}
        animate={{ scale: [1, 1.5, 1.5], opacity: [0.8, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      
      {/* Finger/tap icon */}
      <img 
        src={clickIcon} 
        alt="Click Icon" 
        className="w-12 h-12 drop-shadow-lg filter brightness-0 invert"
      />
    </motion.div>

    {/* Touch text */}
    <motion.p
      className="text-xl md:text-2xl font-medium text-white tracking-wider uppercase drop-shadow-md"
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      Touch to Begin
    </motion.p>
  </motion.div>
)

/**
 * IdleScreen Component
 * 
 * Displays a screensaver mode with:
 * - Fullscreen video background
 * - Floating glowing particles
 * - Glassmorphism box with animated border
 * - Shimmer effect on text
 * - Touch indicator animation
 */
const IdleScreen = ({ onActivate }) => {
  const videoRef = useRef(null)

  // Generate particles with random properties
  const particles = useMemo(() => {
    const colors = [
      "rgba(255, 255, 255, 0.8)", // White
      "rgba(255, 215, 0, 0.6)",   // Gold
      "rgba(255, 255, 255, 0.4)", // Faint white
    ]
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 6,
      startX: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [])

  // Handle video loop
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.addEventListener("ended", () => {
        video.currentTime = 0
        video.play()
      })
      // Start playing when component mounts
      video.play().catch(err => {
        // Ignore AbortError which happens when component unmounts or browser blocks autoplay
        if (err.name !== "AbortError") {
          console.error("Error playing video:", err)
        }
      })
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 1 }}
      onClick={onActivate}
      onTouchStart={onActivate}
      style={{ 
        pointerEvents: "auto",
        overscrollBehavior: 'none',
        overscrollBehaviorY: 'none',
        overscrollBehaviorX: 'none',
        touchAction: 'pan-x pan-y',
      }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={idleScreenVideo} type="video/mp4" />
      </video>

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* Main Content with Glowing Border */}
      <GlowingBorder>
        <motion.div
          className="max-w-3xl w-full mx-4 p-12 md:p-16 bg-black/20 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl text-center"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: 0,
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            opacity: { duration: 1 },
            scale: { duration: 0.8, ease: "easeOut" },
            y: { duration: 0.8, ease: "easeOut" },
          }}
          style={{
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
          }}
        >
          {/* Decorative top line */}
          <motion.div
            className="w-24 h-px mx-auto mb-8 rounded-full bg-white/40"
            animate={{ width: ["0%", "40%", "30%"] }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />

          {/* Main Title with Shimmer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-2 font-heading drop-shadow-md text-white">
              <ShimmerText>Begin Your Journey</ShimmerText>
            </h1>
            <motion.p 
              className="text-xl md:text-2xl lg:text-3xl font-medium text-white/80 tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              AgriTimeline
            </motion.p>
          </motion.div>

          {/* Animated divider */}
          <motion.div
            className="flex items-center justify-center gap-4 my-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <motion.div 
              className="h-px w-16 bg-gradient-to-r from-transparent to-white"
              animate={{ width: [40, 64, 40] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-white"
              animate={{ 
                scale: [1, 1.3, 1],
                boxShadow: [
                  "0 0 10px rgba(255, 255, 255, 0.5)",
                  "0 0 20px rgba(255, 255, 255, 0.8)",
                  "0 0 10px rgba(255, 255, 255, 0.5)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="h-px w-16 bg-gradient-to-l from-transparent to-white"
              animate={{ width: [40, 64, 40] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.div>

          {/* Subtitle with typewriter-like appearance */}
          <motion.p
            className="text-2xl md:text-3xl lg:text-4xl font-light font-body text-white tracking-wide drop-shadow-md"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          >
            Explore{" "}
            <motion.span 
              className="font-bold text-white"
              animate={{ 
                textShadow: [
                  "0 0 8px rgba(255, 255, 255, 0)",
                  "0 0 16px rgba(255, 255, 255, 0.4)",
                  "0 0 8px rgba(255, 255, 255, 0)",
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              a Century
            </motion.span>
            {" "}of Farming
          </motion.p>

          {/* Touch Indicator */}
          <TouchIndicator />

          {/* Decorative bottom line */}
          <motion.div
            className="w-24 h-px mx-auto mt-8 rounded-full bg-white/40"
            animate={{ width: ["0%", "40%", "30%"] }}
            transition={{ duration: 1.5, delay: 0.7 }}
          />
        </motion.div>
      </GlowingBorder>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l border-t border-white/20 rounded-tl-3xl" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r border-t border-white/20 rounded-tr-3xl" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-l border-b border-white/20 rounded-bl-3xl" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-r border-b border-white/20 rounded-br-3xl" />
    </motion.div>
  )
}

export default IdleScreen
