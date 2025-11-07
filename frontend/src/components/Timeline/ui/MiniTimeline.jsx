import React, { useState } from 'react'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { getTheme } from '../../../config/themes'

const MiniTimeline = ({ events, activeYear }) => {
  const [hoveredEvent, setHoveredEvent] = useState(null)
  const theme = getTheme()

  return (
    <div className="w-full py-8">
      {/* Title */}
      <h3 className={`text-xl font-bold ${theme.text.dark || 'text-white'} mb-8 flex items-center gap-2`}>
        <span>⏱</span>
        <span>Belangrijke momenten</span>
      </h3>

      {/* Timeline Container */}
      <div className="relative px-4">
        {/* Connecting Line - gradient from gray through terracotta back to gray */}
        <div
          className="absolute top-6 left-0 right-0 h-0.5"
          style={{
            background: theme.name === 'museum'
              ? 'linear-gradient(to right, #a7b8b4 0%, #a7b8b4 30%, #ae5514 50%, #a7b8b4 70%, #a7b8b4 100%)'
              : 'repeating-linear-gradient(to right, rgb(100 116 139) 0, rgb(100 116 139) 8px, transparent 8px, transparent 16px)',
            height: '2px'
          }}
        />

        {/* Events */}
        <div className="relative flex justify-between items-start">
          {events.map((event, index) => {
            const isActive = event.year === activeYear
            const isHovered = hoveredEvent === event.year

            return (
              <motion.div
                key={`${event.year}-${index}`}
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
                      className="absolute inset-0 rounded-full"
                      style={{
                        scale: 1.5,
                        opacity: 0.3,
                        backgroundColor: theme.name === 'museum' ? '#ae5514' : '#f97316'
                      }}
                      animate={{ scale: [1.5, 2, 1.5], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}

                  {/* Main Dot */}
                  <motion.div
                    className="relative z-10 rounded-full border-4 cursor-pointer transition-all"
                    style={
                      isActive
                        ? {
                            width: '24px',
                            height: '24px',
                            backgroundColor: theme.name === 'museum' ? '#ae5514' : '#f97316',
                            borderColor: theme.name === 'museum' ? '#c9a300' : '#fb923c',
                            boxShadow: theme.name === 'museum'
                              ? '0 10px 15px -3px rgba(174, 85, 20, 0.5)'
                              : '0 10px 15px -3px rgba(249, 115, 22, 0.5)'
                          }
                        : {
                            width: '16px',
                            height: '16px',
                            backgroundColor: theme.name === 'museum' ? '#657575' : '#475569',
                            borderColor: theme.name === 'museum' ? '#a7b8b4' : '#64748b'
                          }
                    }
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                  />

                  {/* Star for Active */}
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 text-xl"
                      style={{ color: theme.name === 'museum' ? '#c9a300' : '#facc15' }}
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
                  <div
                    className="text-sm mb-1"
                    style={{
                      fontWeight: isActive ? 'bold' : 'normal',
                      color: isActive
                        ? theme.name === 'museum' ? '#ae5514' : '#fb923c'
                        : theme.name === 'museum' ? '#657575' : '#cbd5e1'
                    }}
                  >
                    {event.year}
                  </div>
                  <div
                    className="text-xs mb-2"
                    style={{
                      fontWeight: isActive ? '600' : 'normal',
                      color: isActive
                        ? theme.name === 'museum' ? '#440f0f' : '#ffffff'
                        : theme.name === 'museum' ? '#a7b8b4' : '#94a3b8'
                    }}
                  >
                    {event.title}
                  </div>
                  {event.shortDescription && (
                    <div
                      className="text-xs leading-tight"
                      style={{ color: theme.name === 'museum' ? '#a7b8b4' : '#64748b' }}
                    >
                      {event.shortDescription}
                    </div>
                  )}
                </div>

                {/* "You are here" indicator */}
                {isActive && (
                  <motion.div
                    className="mt-2 text-xs font-medium flex items-center gap-1"
                    style={{ color: theme.name === 'museum' ? '#ae5514' : '#fb923c' }}
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
                    className="absolute top-full mt-8 p-3 rounded-lg shadow-xl border max-w-[200px] z-20"
                    style={{
                      backgroundColor: theme.name === 'museum' ? '#f3f2e9' : '#1e293b',
                      color: theme.name === 'museum' ? '#440f0f' : '#ffffff',
                      borderColor: theme.name === 'museum' ? '#a7b8b4' : '#334155'
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="text-xs font-semibold mb-1">{event.title}</div>
                    <div
                      className="text-xs"
                      style={{ color: theme.name === 'museum' ? '#657575' : '#cbd5e1' }}
                    >
                      {event.fullDescription}
                    </div>
                    {/* Arrow pointer */}
                    <div
                      className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent"
                      style={{
                        borderBottomColor: theme.name === 'museum' ? '#f3f2e9' : '#1e293b'
                      }}
                    />
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
