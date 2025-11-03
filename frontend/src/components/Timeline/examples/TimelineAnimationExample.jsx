/**
 * ============================================================================
 * ADVANCED FRAMER MOTION TIMELINE ANIMATION EXAMPLE
 * ============================================================================
 *
 * This component demonstrates advanced animation techniques for an interactive
 * timeline using Framer Motion and Tailwind CSS. It's touchscreen-compatible
 * and includes:
 *
 * 1. ✨ Entry Animations - Cards fade in and slide up on page load
 * 2. 🎯 Staggered Animations - Each card appears with a cascading delay
 * 3. 🔄 Exit Animations - Inactive cards fade/scale down smoothly
 * 4. 📱 Touch-friendly - Works perfectly on touchscreens
 * 5. 🎨 Selection States - Active/inactive visual feedback
 * 6. 🌊 Smooth Transitions - Fluid animations between states
 *
 * ============================================================================
 */

import React, { useState } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { useRef } from "react"

/**
 * ============================================================================
 * ANIMATION VARIANTS
 * ============================================================================
 * Variants are reusable animation configurations that can be applied to
 * motion components. They make animations more maintainable and readable.
 */

// Container variant for stagger children animations
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      // Stagger children: each child animates 0.15s after the previous one
      staggerChildren: 0.15,
      delayChildren: 0.2, // Wait 0.2s before starting children animations
      when: "beforeChildren", // Animate container before children
    }
  }
}

// Card animation variants with multiple states
const cardVariants = {
  // Initial state when component mounts
  hidden: {
    opacity: 0,
    y: 100, // Start 100px below
    scale: 0.8, // Start at 80% size
    rotateX: -15, // Add slight 3D tilt
  },
  // Visible state (normal)
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring", // Spring physics for natural movement
      stiffness: 100,
      damping: 15,
      mass: 1,
    }
  },
  // Active/selected state
  active: {
    scale: 1.05,
    y: -10,
    boxShadow: "0 25px 50px rgba(59, 130, 246, 0.5)",
    borderColor: "rgba(59, 130, 246, 0.8)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    }
  },
  // Inactive/deselected state (when another card is selected)
  inactive: {
    opacity: 0.4,
    scale: 0.95,
    filter: "blur(2px) grayscale(30%)",
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  // Hover state
  hover: {
    scale: 1.08,
    y: -12,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    }
  },
  // Tap/click state
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  },
  // Exit animation
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  }
}

// Year badge animation variants
const yearVariants = {
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.1, // Slight delay after card appears
    }
  },
  hover: {
    scale: 1.15,
    rotate: [0, -5, 5, 0], // Wiggle animation
    transition: {
      duration: 0.4
    }
  }
}

// Icon animation variants
const iconVariants = {
  hidden: {
    scale: 0,
    rotate: -90,
  },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      delay: 0.2,
    }
  },
  hover: {
    rotate: [0, -10, 10, -10, 10, 0],
    scale: 1.2,
    transition: {
      duration: 0.6
    }
  }
}

// Selection badge animation (checkmark)
const badgeVariants = {
  hidden: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  visible: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    }
  },
  exit: {
    scale: 0,
    rotate: 180,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

/**
 * ============================================================================
 * TIMELINE CARD COMPONENT
 * ============================================================================
 */
const TimelineCard = ({ period, index, isSelected, isInactive, onSelect }) => {
  const cardRef = useRef(null)
  // useInView detects when card enters viewport (great for scroll animations)
  const isInView = useInView(cardRef, {
    once: true, // Only animate once
    amount: 0.3 // Trigger when 30% visible
  })

  // Determine which animation state to use
  const getAnimationState = () => {
    if (isSelected) return "active"
    if (isInactive) return "inactive"
    return "visible"
  }

  return (
    <motion.div
      ref={cardRef}
      className="relative flex-shrink-0 z-10"
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? getAnimationState() : "hidden"}
      exit="exit"
      whileHover={!isInactive ? "hover" : undefined}
      whileTap={!isInactive ? "tap" : undefined}
      layout // Smooth layout transitions
    >
      <div className={`${index % 2 === 0 ? "mb-48" : "mt-48"} w-80`}>
        <motion.div
          className="cursor-pointer"
          onClick={() => !isInactive && onSelect(period.id)}
        >
          {/* Year Badge */}
          <div className="text-center mb-6">
            <motion.div
              className={`text-5xl font-bold bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent filter drop-shadow-lg`}
              variants={yearVariants}
              whileHover="hover"
            >
              {period.year}
            </motion.div>
          </div>

          {/* Card */}
          <motion.div
            className="relative backdrop-blur-lg bg-white/20 p-8 rounded-3xl border-2 border-white/30 overflow-hidden mb-8 shadow-xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)"
            }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${period.gradient} opacity-20`} />

            {/* Icon */}
            <div className="relative flex justify-center mb-6">
              <motion.div
                className="w-20 h-20 flex items-center justify-center text-4xl backdrop-blur-sm bg-white/20 rounded-2xl border border-white/30 shadow-lg"
                variants={iconVariants}
                whileHover="hover"
              >
                {period.icon || "🌾"}
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              className="text-center mb-4 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className={`text-2xl font-bold bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent leading-tight`}>
                {period.title}
              </h3>
            </motion.div>

            {/* Description */}
            <motion.div
              className="text-center relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-gray-200 leading-relaxed">
                {period.description}
              </p>
            </motion.div>

            {/* Selection Badge (Checkmark) */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-400/50"
                  variants={badgeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <span className="text-white text-lg font-bold">✓</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulse animation for active card */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-blue-400"
                animate={{
                  scale: [1, 1.02, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * ============================================================================
 * MAIN TIMELINE COMPONENT
 * ============================================================================
 */
const TimelineAnimationExample = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const timelineRef = useRef(null)

  // Sample timeline data
  const timelineData = [
    {
      id: "period-1",
      year: "1925",
      title: "Museum Foundation",
      description: "The Fries Landbouwmuseum begins with a modest dairy exhibition in Leeuwarden.",
      gradient: "from-amber-600 to-orange-500",
      icon: "🏛️"
    },
    {
      id: "period-2",
      year: "1950",
      title: "Post-War Expansion",
      description: "Rapid expansion of the collection after World War II, various temporary locations.",
      gradient: "from-blue-600 to-cyan-500",
      icon: "📦"
    },
    {
      id: "period-3",
      year: "1987",
      title: "New Beginning",
      description: "Official reopening as Fries Landbouwmuseum with clear mission and provincial subsidy.",
      gradient: "from-green-600 to-emerald-500",
      icon: "🌱"
    },
    {
      id: "period-4",
      year: "2018",
      title: "Leeuwarden Location",
      description: "Museum settles in monumental farm building at the southern edge of Leeuwarden.",
      gradient: "from-rose-600 to-pink-500",
      icon: "🏡"
    },
    {
      id: "period-5",
      year: "2025",
      title: "100 Year Jubilee",
      description: "Thorough modernization and official celebration of the 100-year anniversary.",
      gradient: "from-yellow-500 to-amber-600",
      icon: "🎉"
    },
  ]

  const handleCardSelect = (periodId) => {
    setSelectedPeriod(prevId => prevId === periodId ? null : periodId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden p-8">
      {/* Header with fade-in animation */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="text-5xl font-bold text-white mb-4">
          Interactive Timeline
        </h1>
        <p className="text-xl text-gray-300">
          Click any card to select it • Animations with Framer Motion
        </p>
      </motion.div>

      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="relative overflow-x-auto scrollbar-hide pb-32"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Timeline Line */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 w-full min-w-max shadow-lg shadow-blue-400/50 rounded-full"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: "left" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 blur-sm opacity-70 rounded-full" />
        </motion.div>

        {/* Timeline Cards with Container Variants for Stagger */}
        <motion.div
          className="flex items-center space-x-16 md:space-x-32 min-w-max px-16 md:px-32 pt-16 md:pt-24 pb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {timelineData.map((period, index) => (
            <TimelineCard
              key={period.id}
              period={period}
              index={index}
              isSelected={selectedPeriod === period.id}
              isInactive={selectedPeriod !== null && selectedPeriod !== period.id}
              onSelect={handleCardSelect}
            />
          ))}
        </motion.div>
      </div>

      {/* Instructions Panel */}
      <motion.div
        className="fixed bottom-8 left-8 bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 max-w-md"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <h3 className="text-white font-bold text-lg mb-2">Animation Features:</h3>
        <ul className="text-gray-200 text-sm space-y-1">
          <li>✨ Fade in + Slide up on entry</li>
          <li>🎯 Staggered animation (0.15s delay)</li>
          <li>🔄 Inactive cards fade and blur</li>
          <li>📱 Touch-friendly interactions</li>
          <li>🎨 Active state with pulse effect</li>
          <li>🌊 Spring physics for natural motion</li>
        </ul>
      </motion.div>
    </div>
  )
}

/**
 * ============================================================================
 * USAGE GUIDE
 * ============================================================================
 *
 * How to use this component in your project:
 *
 * 1. Install Framer Motion if not already installed:
 *    npm install framer-motion
 *
 * 2. Import the component:
 *    import TimelineAnimationExample from './TimelineAnimationExample'
 *
 * 3. Use in your JSX:
 *    <TimelineAnimationExample />
 *
 * 4. Customize the animations by modifying the variants object
 *
 * 5. Key animation concepts used:
 *    - variants: Reusable animation states
 *    - initial: Starting state
 *    - animate: Target state
 *    - exit: Leaving state
 *    - whileHover: Hover interaction
 *    - whileTap: Click interaction
 *    - transition: Timing and easing
 *    - staggerChildren: Cascading animations
 *    - AnimatePresence: Mount/unmount animations
 *
 * ============================================================================
 */

export default TimelineAnimationExample
