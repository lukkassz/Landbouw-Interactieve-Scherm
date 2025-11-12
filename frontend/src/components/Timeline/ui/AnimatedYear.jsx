import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import CountUp from "react-countup"

/**
 * AnimatedYear Component
 *
 * Animates year display from 0 to target value on mount.
 * Supports single years (e.g., "1925") and ranges (e.g., "1930-1956").
 */
const AnimatedYear = ({ year, theme, gradient }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation when component mounts with small delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Parse year string to extract numbers
  const parseYear = yearString => {
    if (!yearString) return { start: 0, end: null, isRange: false }

    const rangeMatch = yearString.match(/(\d{4})-(\d{4})/)
    if (rangeMatch) {
      return {
        start: parseInt(rangeMatch[1], 10),
        end: parseInt(rangeMatch[2], 10),
        isRange: true,
      }
    }

    const singleMatch = yearString.match(/(\d{4})/)
    if (singleMatch) {
      return {
        start: parseInt(singleMatch[1], 10),
        end: null,
        isRange: false,
      }
    }

    return { start: 0, end: null, isRange: false }
  }

  const { start, end, isRange } = parseYear(year)

  return (
    <motion.div
      className="text-5xl font-bold filter drop-shadow-lg"
      style={{
        color: "#c9a300",
      }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.1 }}
    >
      {isRange ? (
        <span>
          {isVisible ? (
            <>
              <CountUp
                start={0}
                end={start}
                duration={2}
                separator=""
                easingFn={(t, b, c, d) => {
                  // Custom ease-out function
                  t /= d
                  return -c * t * (t - 2) + b
                }}
              />
              -
              <CountUp
                start={0}
                end={end}
                duration={2}
                separator=""
                easingFn={(t, b, c, d) => {
                  // Custom ease-out function
                  t /= d
                  return -c * t * (t - 2) + b
                }}
              />
            </>
          ) : (
            `0-0`
          )}
        </span>
      ) : (
        <>
          {isVisible ? (
            <CountUp
              start={0}
              end={start}
              duration={2}
              separator=""
              easingFn={(t, b, c, d) => {
                // Custom ease-out function
                t /= d
                return -c * t * (t - 2) + b
              }}
            />
          ) : (
            "0"
          )}
        </>
      )}
    </motion.div>
  )
}

export default AnimatedYear
