/**
 * TimelineModal Component
 *
 * Modal window that appears when clicking on a timeline item.
 * Displays detailed information about a specific historical period.
 *
 * How it works:
 * - Receives 3 props: isOpen (boolean), onClose (function), timelineItem (period data)
 * - Returns null if isOpen is false or timelineItem is empty
 * - Uses Framer Motion for smooth animations (fade in/out, scale effects)
 * - Two-column layout: left for information, right for media content
 */

import React, { useState } from "react"
import { motion } from "framer-motion"
import { X, Play, Image, Video } from "lucide-react"
import ImagePuzzleModal from "../../PuzzleGame/ImagePuzzleModal"

const TimelineModal = ({ isOpen, onClose, timelineItem }) => {
  const [isPuzzleOpen, setIsPuzzleOpen] = useState(false)

  // Check if modal should be open and has data
  if (!isOpen || !timelineItem) return null

  return (
    // Background overlay - covers entire screen with dark layer
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Main modal window */}
      <motion.div
        className="relative w-full max-w-6xl h-full max-h-[90vh] bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button - red X in top-right */}
        <motion.button
          className="absolute top-6 right-6 z-10 w-12 h-12 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
        >
          <X size={24} />
        </motion.button>

        {/* Scrollable content container */}
        <div className="h-full overflow-y-auto">
          {/* Grid layout: 1 column on mobile, 2 columns on large screens */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* LEFT COLUMN: Information section */}
            <div className="flex flex-col space-y-6">
              <div className="bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
                {/* Section header with icon */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📖</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Information</h2>
                </div>

                {/* Content box with title, description, and buttons */}
                <div className="bg-slate-800/60 rounded-xl p-6">
                  {/* Title of selected period */}
                  <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                    {timelineItem.title}
                  </h3>

                  {/* Description text - from timelineItem data */}
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {timelineItem.description ||
                      "Informative text about this period will be displayed here. This section provides detailed information about the historical context, significance, and key developments of this era."}
                  </p>

                  {/* Interactive content buttons */}
                  <div className="flex flex-col space-y-4">
                    <motion.button
                      className="flex items-center space-x-2 px-6 py-3 bg-theme-primary text-white rounded-xl font-semibold transition-all duration-200"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play size={18} />
                      <span>Audio Guide</span>
                    </motion.button>

                    {/* Puzzle Game - for items with puzzle image */}
                    {timelineItem.hasPuzzle && (
                      <motion.button
                        className="flex items-center space-x-2 px-6 py-3 bg-theme-accent text-white rounded-xl font-semibold transition-all duration-200"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsPuzzleOpen(true)}
                      >
                        <Image size={18} />
                        <span>Speel Puzzle</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Media section */}
            <div className="flex flex-col space-y-6">
              <div className="bg-slate-700/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30">
                {/* Media section header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📱</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Media</h2>
                </div>

                {/* Media display area - photos, videos, 3D models go here */}
                <div className="bg-slate-800/60 rounded-xl p-6 mb-6">
                  {/* Placeholder for media content - 16:9 aspect ratio */}
                  <div className="aspect-video bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-500">
                    <div className="text-center text-gray-400">
                      <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Image size={32} />
                      </div>
                      <p className="font-medium">
                        Media content will be displayed here
                      </p>
                      <p className="text-sm">Image or Video</p>
                    </div>
                  </div>
                </div>

                {/* Media buttons - 2 buttons in a row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Gallery button (orange/red) */}
                  <motion.button
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image size={18} />
                    <span className="hidden sm:inline">Gallery</span>
                  </motion.button>

                  {/* Video button (purple) */}
                  <motion.button
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Video size={18} />
                    <span className="hidden sm:inline">Video</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Puzzle Modal */}
      <ImagePuzzleModal
        isOpen={isPuzzleOpen}
        onClose={() => setIsPuzzleOpen(false)}
        puzzleImage={timelineItem?.puzzleImage}
      />
    </motion.div>
  )
}

/**
 * Usage example:
 *
 * 1. Import: import TimelineModal from './modals/TimelineModal'
 *
 * 2. State in parent component:
 *    const [isModalOpen, setIsModalOpen] = useState(false)
 *    const [selectedItem, setSelectedItem] = useState(null)
 *
 * 3. Open modal:
 *    setSelectedItem(timelineItemData)
 *    setIsModalOpen(true)
 *
 * 4. In JSX:
 *    <TimelineModal
 *      isOpen={isModalOpen}
 *      onClose={() => setIsModalOpen(false)}
 *      timelineItem={selectedItem}
 *    />
 *
 * NOTE: All buttons do not yet have functionality!
 * They still need to be connected to actual media content.
 */

export default TimelineModal
