import React, { useState } from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

const MiniTimeline = ({ events, activeYear }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null)

  return (
    <div className="w-full py-8">
      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
        <span>⏱</span>
        <span>Belangrijke momenten</span>
      </h3>

      {/* Timeline Container */}
      <div className="relative px-4">
        {/* Connecting Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-500" style={{
          backgroundImage: 'repeating-linear-gradient(to right, rgb(100 116 139) 0, rgb(100 116 139) 8px, transparent 8px, transparent 16px)',
          height: '2px'
        }} />

        {/* Events */}
        <div className="relative flex justify-between items-start">
          {events.map((event, index) => {
            const isActive = event.year === activeYear
            const isHovered = hoveredEvent === event.year

            return (
              <motion.div
                key={event.year}
                className="flex flex-col items-center relative"
                style={{ flex: 1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                onMouseEnter={() => setHoveredEvent(event.year)}
                onMouseLeave={() => setHoveredEvent(null)}
                onTouchStart={() => setHoveredEvent(event.year)}
              >
                {/* Marker */}
                <div className="relative mb-4">
                  {/* Pulsing Ring for Active */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-orange-500"
                      style={{ scale: 1.5, opacity: 0.3 }}
                      animate={{ scale: [1.5, 2, 1.5], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}

                  {/* Main Dot */}
                  <motion.div
                    className={`relative z-10 rounded-full border-4 cursor-pointer transition-all ${
                      isActive
                        ? 'w-6 h-6 bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/50'
                        : 'w-4 h-4 bg-slate-600 border-slate-500'
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                  />

                  {/* Star for Active */}
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 text-yellow-400 text-xl"
                      initial={{ rotate: -45, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: index * 0.2 + 0.3, type: 'spring' }}
                    >
                      ⭐
                    </motion.div>
                  )}
                </div>

                {/* Event Info */}
                <div className="text-center max-w-[120px]">
                  <div className={`text-sm mb-1 ${isActive ? 'font-bold text-orange-400' : 'text-slate-300'}`}>
                    {event.year}
                  </div>
                  <div className={`text-xs mb-2 ${isActive ? 'font-semibold text-white' : 'text-slate-400'}`}>
                    {event.title}
                  </div>
                  {event.shortDescription && (
                    <div className="text-xs text-slate-500 leading-tight">
                      {event.shortDescription}
                    </div>
                  )}
                </div>

                {/* "You are here" indicator */}
                {isActive && (
                  <motion.div
                    className="mt-2 text-xs text-orange-400 font-medium flex items-center gap-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 + 0.5 }}
                  >
                    <span>▲</span>
                    <span>Jij bent hier</span>
                  </motion.div>
                )}

                {/* Tooltip on Hover */}
                {isHovered && event.fullDescription && (
                  <motion.div
                    className="absolute top-full mt-8 bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 max-w-[200px] z-20"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="text-xs font-semibold mb-1">{event.title}</div>
                    <div className="text-xs text-slate-300">{event.fullDescription}</div>
                    {/* Arrow pointer */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-slate-800" />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

MiniTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      shortDescription: PropTypes.string,
      fullDescription: PropTypes.string
    })
  ).isRequired,
  activeYear: PropTypes.number.isRequired
}

export default MiniTimeline
