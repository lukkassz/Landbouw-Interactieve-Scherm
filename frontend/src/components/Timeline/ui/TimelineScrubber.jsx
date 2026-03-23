import React, { useRef, useMemo } from "react"
import { motion } from "framer-motion"

/**
 * Modern Timeline Scrubber
 * Renders the bottom navigation bar with decade markers and active selection indicator
 */
const TimelineScrubber = ({ events = [], activeIndex = 0, onSelectEvent, minYear = 1850, maxYear = 2050 }) => {
  const scrubberRef = useRef(null)

  // Determine active event
  const activeEvent = events[activeIndex]
  const activeYear = activeEvent?.year ? parseInt(activeEvent.year.match(/\d{4}/)?.[0] || activeEvent.year) : 1925

  // Generate decade markers (1850, 1900, 1950, MODERN)
  const markers = [
    { label: "1850", value: 1850 },
    { label: "1900", value: 1900 },
    { label: "1950", value: 1950 },
    { label: "MODERN", value: 2025 }
  ]

  // Calculate percentage down the line for a given year
  const getPercentageForYear = (year) => {
    const range = maxYear - minYear
    const percent = Math.max(0, Math.min(1, (year - minYear) / range))
    return percent * 100
  }

  // Active position
  const activePercentage = getPercentageForYear(activeYear)

  const handleTrackClick = (e) => {
    if (!scrubberRef.current || events.length === 0) return
    const rect = scrubberRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const clickPercentage = Math.max(0, Math.min(1, x / rect.width))
    const clickedYear = minYear + (clickPercentage * (maxYear - minYear))
    
    // Find closest event
    let closestIdx = 0
    let minDiff = Infinity
    
    events.forEach((ev, idx) => {
      const y = ev.year ? parseInt(ev.year.match(/\d{4}/)?.[0] || ev.year) : 1925
      const diff = Math.abs(y - clickedYear)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = idx
      }
    })
    
    onSelectEvent(closestIdx)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-32 z-50 flex items-center justify-center px-10 md:px-24">
      
      {/* Container for the line and markers */}
      <div className="w-full max-w-6xl relative flex items-center">
        
        {/* Main Track Line */}
        <div 
          className="w-full h-[1px] bg-white/20 relative cursor-pointer group flex-1"
          ref={scrubberRef}
          onClick={handleTrackClick}
        >
          {/* Active Progress Line (Optional, mockup has subtle highlight) */}
          <div 
            className="absolute top-0 left-0 h-full bg-white/40" 
            style={{ width: `${activePercentage}%` }} 
          />
          
          {/* Markers */}
          {markers.map((marker, i) => {
            const pos = getPercentageForYear(marker.value)
            return (
              <div 
                key={marker.label}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                style={{ left: `${pos}%`, transform: `translate(-50%, -50%)` }}
              >
                <span className="text-white/40 text-[10px] tracking-[0.2em] mb-4 uppercase font-sans font-semibold">
                  {marker.label}
                </span>
                <div className="w-2 h-2 rounded-full border border-white/40 bg-transparent" />
                {/* Specific icon below marker (like mockup shows tractor, sun, factory) */}
                <div className="mt-4 opacity-40">
                  {marker.value === 1850 && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><line x1="14" y1="17" x2="10" y2="17"/><path d="M12 17V7h4"/><path d="M7 14v-4h4"/></svg>
                  )}
                  {marker.value === 1900 && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  )}
                  {marker.value === 1950 && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="10" width="20" height="10" rx="2" ry="2"/><path d="M2 10v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/><path d="M10 10v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/><path d="M18 10v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/></svg>
                  )}
                </div>
              </div>
            )
          })}

          {/* Active Highlight Marker (The gold circle) */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20"
            initial={false}
            animate={{ left: `${activePercentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ transform: `translate(-50%, -50%)` }}
          >
            {/* Year Tooltip above */}
            <div className="absolute -top-14 font-bold text-[#e0b85a] tracking-[0.1em] text-sm">
              {activeYear}
            </div>
            
            {/* The Gold Circle */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e0b85a] to-[#b8871f] flex items-center justify-center shadow-[0_0_20px_rgba(224,184,90,0.4)] border border-white/20">
              {/* Central Icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            
            {/* Status Label below */}
            <div className="absolute -bottom-10 font-bold text-[#e0b85a] text-[10px] uppercase tracking-[0.25em]">
              Mechanized
            </div>
            
            {/* Short line under label indicating selection */}
            <div className="absolute -bottom-14 w-10 h-0.5 bg-[#e0b85a]" />
          </motion.div>
        </div>

        {/* Right Action Button - EXPLORE NEXT ERA */}
        <div 
          className="ml-12 flex items-center gap-4 cursor-pointer group"
          onClick={() => {
            if (activeIndex < events.length - 1) {
              onSelectEvent(activeIndex + 1)
            }
          }}
        >
          <span className="text-white/40 text-[10px] tracking-[0.2em] font-sans font-semibold group-hover:text-white/80 transition-colors uppercase">
            Explore Next Era
          </span>
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/50 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </div>
        </div>

      </div>
    </div>
  )
}

export default TimelineScrubber
