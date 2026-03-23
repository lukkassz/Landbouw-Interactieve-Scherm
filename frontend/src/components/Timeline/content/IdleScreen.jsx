import React, { useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import idleScreenVideo from "../../../assets/video/idle_screen.mp4"

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
      opacity: [0, 0.6, 0.6, 0],
      scale: [0, 1, 1.2, 0.5],
      x: [0, Math.random() * 80 - 40, Math.random() * 120 - 60],
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
 * QR / scan icon for the archival access button
 */
const QrIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="4" height="4" />
    <line x1="7" y1="7" x2="7" y2="7" />
    <line x1="17" y1="7" x2="17" y2="7" />
    <line x1="7" y1="17" x2="7" y2="17" />
  </svg>
)

/**
 * Arrow right icon for CTA button
 */
const ArrowRight = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
)

/**
 * IdleScreen Component — editorial/museum layout
 *
 * Layout matches design mockup:
 * - Top-left: Logo (AgriTimeline / THE HERITAGE LENS)
 * - Top-right: ARCHIVAL ACCESS button
 * - Center-left: Label + large hero headline (mixed italic/normal)
 * - Below hero: Description paragraph
 * - Bottom-left: CURRENT DISPLAY label + title
 * - Bottom-right: Golden pill CTA "BEGIN YOUR JOURNEY"
 */
const IdleScreen = ({ onActivate }) => {
  const videoRef = useRef(null)

  // Generate particles with random properties
  const particles = useMemo(() => {
    const colors = [
      "rgba(255, 255, 255, 0.6)",
      "rgba(197, 150, 43, 0.5)",
      "rgba(255, 255, 255, 0.3)",
    ]
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 8,
      startX: Math.random() * 100,
      size: 3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  }, [])

  // Handle video loop
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.play().catch(err => {
        if (err.name !== "AbortError") {
          console.error("Error playing video:", err)
        }
      })
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: "none" }}
      transition={{ duration: 0.8 }}
      style={{
        pointerEvents: "auto",
        overscrollBehavior: "none",
        touchAction: "pan-x pan-y",
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

      {/* Dark gradient overlay — heavier on left for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.10) 100%)",
        }}
      />

      {/* Bottom fade for polish */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)",
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <FloatingParticle key={particle.id} {...particle} />
        ))}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="relative z-10 w-full h-full flex flex-col p-10 md:p-14">

        {/* ── TOP BAR ── */}
        <div className="flex items-start justify-between w-full">

          {/* Logo — top left */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h2
              className="text-white font-serif italic text-3xl md:text-4xl leading-none tracking-tight drop-shadow-lg"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              AgriTimeline
            </h2>
            <p
              className="text-white/70 text-xs tracking-[0.25em] uppercase mt-1 font-sans"
            >
              The Heritage Lens
            </p>
          </motion.div>

          {/* Archival Access button — top right */}
          <motion.button
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            onClick={e => {
              e.stopPropagation()
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-full border border-white/40 bg-white/10 backdrop-blur-md text-white/90 text-xs tracking-[0.18em] uppercase font-sans hover:bg-white/20 transition-colors duration-200"
          >
            <QrIcon />
            <span>Archival Access 0422</span>
          </motion.button>

        </div>

        {/* ── HERO SECTION — left aligned, vertically centered ── */}
        <div className="flex-1 flex flex-col justify-center mt-4">

          {/* Collection label */}
          <motion.p
            className="text-xs md:text-sm tracking-[0.28em] uppercase font-sans mb-5"
            style={{ color: "#C5962B" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Digital Curator Collection
          </motion.p>

          {/* Hero headline */}
          <motion.h1
            className="text-white leading-[1.05] drop-shadow-xl"
            style={{
              fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
              maxWidth: "58%",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            {/* Line 1 */}
            <span
              className="block font-sans font-light"
              style={{ letterSpacing: "-0.01em" }}
            >
              Tracing the
            </span>
            {/* Line 2 — italic word + normal word */}
            <span className="block">
              <span
                className="font-serif italic font-normal"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                Fertile{" "}
              </span>
              <span className="font-sans font-light">Path.</span>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-white/75 font-sans font-light leading-relaxed mt-6"
            style={{
              fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)",
              maxWidth: "44%",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          >
            An immersive journey through three centuries of Dutch agricultural
            innovation, resilience, and landscape evolution.
          </motion.p>

        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="flex items-end justify-between w-full">

          {/* Current Display — bottom left */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
          >
            <p className="text-white/55 text-xs tracking-[0.22em] uppercase font-sans mb-1">
              Current Display
            </p>
            <p
              className="text-white font-serif italic text-lg md:text-xl leading-tight drop-shadow"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              The Golden Age of Windmills
            </p>
          </motion.div>

          {/* CTA Button — bottom right (golden pill) */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease: "easeOut" }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onActivate}
            className="flex items-center gap-3 px-8 py-5 rounded-full font-sans font-semibold text-sm tracking-[0.2em] uppercase shadow-xl transition-shadow duration-200"
            style={{
              background: "linear-gradient(135deg, #C5962B 0%, #d4a93a 50%, #b8871f 100%)",
              color: "#1a1100",
              boxShadow: "0 8px 32px rgba(197,150,43,0.45), 0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <span>Begin Your Journey</span>
            <ArrowRight />
          </motion.button>

        </div>
      </div>
    </motion.div>
  )
}

export default IdleScreen
