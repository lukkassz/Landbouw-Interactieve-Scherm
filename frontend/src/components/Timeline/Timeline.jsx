import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const Timeline = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const timelineRef = useRef(null)

  // Mock data - later replace with database
  const timelineData = [
    {
      id: "early-agriculture",
      year: "10,000 BCE",
      title: "Early Agriculture",
      description:
        "The development of farming fundamentally changed human civilization. Early humans transitioned from hunting and gathering to cultivating crops and domesticating animals.",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      id: "irrigation",
      year: "6,000 BCE",
      title: "Irrigation Systems",
      description:
        "Advanced civilizations developed sophisticated irrigation networks, allowing agriculture to flourish in arid regions and supporting larger populations.",
      gradient: "from-blue-400 to-cyan-500",
    },
    {
      id: "plowing",
      year: "4,000 BCE",
      title: "The Plow Revolution",
      description:
        "The invention of the plow dramatically increased agricultural productivity, enabling farmers to cultivate larger areas more efficiently than ever before.",
      gradient: "from-green-400 to-emerald-500",
    },
    {
      id: "mechanization",
      year: "1850 CE",
      title: "Mechanization Era",
      description:
        "Steam-powered machinery and later tractors revolutionized farming, allowing farmers to work larger areas with significantly less manual labor.",
      gradient: "from-gray-500 to-slate-600",
    },
    {
      id: "modern",
      year: "1960 CE",
      title: "Green Revolution",
      description:
        "High-yield crop varieties, modern irrigation, and intensive farming techniques led to unprecedented increases in food production worldwide.",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      id: "sustainable",
      year: "2000 CE",
      title: "Sustainable Farming",
      description:
        "Modern agriculture focuses on environmentally sustainable practices, including organic farming, integrated pest management, and climate-smart techniques.",
      gradient: "from-green-500 to-emerald-600",
    },
  ]

  const handleMouseDown = e => {
    setIsDragging(true)
    setStartX(e.pageX || e.touches[0].pageX)
    setScrollLeft(timelineRef.current.scrollLeft)
  }

  const handleMouseMove = e => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX || e.touches[0].pageX
    const walk = (x - startX) * 2
    timelineRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCardClick = periodId => {
    if (!isDragging) {
      setSelectedPeriod(periodId)
      console.log("Navigate to period:", periodId)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative flex items-center justify-center">
      <div className="timeline-container py-12 px-4 relative w-full">
        {/* Timeline Container - no header, no indicators */}
        <div
          ref={timelineRef}
          className="relative pb-8 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            scrollBehavior: isDragging ? "auto" : "smooth",
            userSelect: "none",
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflow: "auto",
            }}
            className="overflow-x-auto"
          >
            {/* Completely hide all scrollbars */}
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none !important;
                width: 0 !important;
                height: 0 !important;
              }
              div {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
              }
            `}</style>

            {/* Timeline Line */}
            <div className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 w-full min-w-max shadow-lg shadow-blue-400/50"></div>

            {/* Timeline Items */}
            <motion.div
              className="flex items-center space-x-32 min-w-max px-16 pt-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {timelineData.map((period, index) => (
                <motion.div
                  key={period.id}
                  className="relative flex-shrink-0 z-10"
                  initial={{ opacity: 0, y: 100, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.2,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className={`${index % 2 === 0 ? "mb-40" : "mt-40"} w-80`}
                  >
                    <motion.div
                      className="cursor-pointer"
                      onClick={() => handleCardClick(period.id)}
                      whileHover={{
                        scale: 1.05,
                        y: -8,
                        rotateY: 5,
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Year */}
                      <div className="text-center mb-6">
                        <motion.div
                          className={`text-5xl font-bold bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent filter drop-shadow-lg`}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {period.year}
                        </motion.div>
                      </div>

                      {/* Card */}
                      <motion.div
                        className="relative backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
                        animate={{
                          boxShadow:
                            selectedPeriod === period.id
                              ? "0 25px 50px rgba(244, 63, 94, 0.25), 0 0 0 2px rgba(244, 63, 94, 0.5)"
                              : "0 15px 35px rgba(0,0,0,0.2)",
                          backgroundColor:
                            selectedPeriod === period.id
                              ? "rgba(244, 63, 94, 0.1)"
                              : "rgba(255, 255, 255, 0.1)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${period.gradient} opacity-20`}
                        />

                        <div className="relative flex justify-center mb-6">
                          <motion.div
                            className="w-20 h-20 flex items-center justify-center text-4xl backdrop-blur-sm bg-white/20 rounded-2xl border border-white/30 shadow-lg"
                            whileHover={{
                              rotate: [0, -10, 10, -10, 0],
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            🌾
                          </motion.div>
                        </div>

                        <div className="text-center mb-4 relative">
                          <h3
                            className={`text-2xl font-bold bg-gradient-to-r ${period.gradient} bg-clip-text text-transparent leading-tight`}
                          >
                            {period.title}
                          </h3>
                        </div>

                        <div className="text-center relative">
                          <p className="text-gray-200 leading-relaxed">
                            {period.description}
                          </p>
                        </div>

                        <AnimatePresence>
                          {selectedPeriod === period.id && (
                            <motion.div
                              className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-400/50"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="text-white text-sm font-bold">
                                ✓
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Timeline
