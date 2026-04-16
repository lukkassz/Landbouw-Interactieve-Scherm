import React from "react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * ActiveEventSlide Component
 * Displays a single timeline event in a full-screen editorial layout.
 *
 * Text/infobox content comes from the `event` object (populated via the
 * admin panel). Fields that are empty render nothing instead of showing
 * placeholder mockup strings.
 */
const ActiveEventSlide = ({ event, isActive }) => {
  if (!event) return null

  // Safely get properties
  const yearString = event.year || ""
  const title = event.title || ""
  const subtitle = event.subtitle || ""
  const description = event.description || ""
  const mainImage = event.mainImage || "https://images.unsplash.com/photo-1592982537447-6f2ab2c9f53e?q=80&w=2000&auto=format&fit=crop"

  const infoboxTitle = event.infobox_title?.trim() || ""
  const infoboxSubtitle = event.infobox_subtitle?.trim() || ""
  const hasInfobox = Boolean(infoboxTitle || infoboxSubtitle)
  
  // Format title to have the last word in italics if it's multiple words
  const titleWords = title.split(" ")
  const hasMultipleWords = titleWords.length > 1
  const normalTitlePart = hasMultipleWords ? titleWords.slice(0, -1).join(" ") : ""
  const italicTitlePart = hasMultipleWords ? titleWords[titleWords.length - 1] : title
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={event.id}
          className="absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-between pointer-events-none z-10 overflow-y-auto overflow-x-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background specific to this event if needed, but usually handled by parent. 
              We'll just add the dark gradient overlay here specifically for the text layout. */}
          <div 
            className="absolute inset-0 -z-10"
            style={{
              background: 'linear-gradient(105deg, rgba(10,25,30,0.85) 0%, rgba(30,40,30,0.6) 45%, rgba(0,0,0,0.1) 100%)'
            }}
          />

          {/* Left Column - Text Content */}
          <motion.div 
            className="w-full md:w-1/2 flex-shrink-0 md:flex-shrink flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 pointer-events-auto pt-32 md:pt-20 pb-10 md:pb-0"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Year Label */}
            <div 
              className="text-xs md:text-sm font-bold tracking-[0.2em] mb-4 uppercase"
              style={{ color: "#e0b85a" }} // Gold color from mockup
            >
              {yearString}
            </div>

            {/* Main Title */}
            <h1 className="text-white text-4xl sm:text-5xl md:text-5xl lg:text-7xl leading-[1.05] tracking-tight drop-shadow-lg mb-2 break-words">
              <span className="block font-sans font-light">{normalTitlePart}</span>
              <span 
                className="block font-serif font-normal italic mt-1 break-words"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                {italicTitlePart}
              </span>
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <h3 
                className="text-xl md:text-2xl lg:text-3xl font-serif italic mb-6 mt-4 break-words"
                style={{ color: "#e0b85a", fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                {subtitle}
              </h3>
            )}

            {/* Description */}
            <p className="text-white/80 text-base md:text-lg lg:text-xl font-sans font-light leading-relaxed max-w-xl">
              {description}
            </p>
          </motion.div>

          {/* Right Column - Image Presentation */}
          <motion.div 
            className="w-full md:w-1/2 h-auto flex flex-col items-center justify-center px-6 sm:px-10 relative pointer-events-auto pb-48 md:pb-0 mt-8 md:mt-0"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 50 }}
          >
            {/* Tilted Photo Frame */}
            <div 
              className="relative w-full max-w-xl aspect-[4/3] rounded-2xl bg-white/10 p-2 backdrop-blur-sm shadow-2xl"
              style={{ 
                transform: "rotate(3deg)",
                border: "1px solid rgba(255,255,255,0.2)"
              }}
            >
              <div className="w-full h-full rounded-xl overflow-hidden relative">
                <img 
                  src={mainImage} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]"></div>
              </div>

              {/* Floating Info Box on Image — only rendered when the admin
                  has filled in infobox_title or infobox_subtitle. Avoids
                  showing mockup placeholders on events that don't have
                  infobox data. */}
              {hasInfobox && (
                <motion.div
                  className="absolute -bottom-8 -right-8 md:-right-12 rounded-xl backdrop-blur-md p-6 shadow-2xl overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(200, 180, 130, 0.9) 0%, rgba(150, 130, 80, 0.95) 100%)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    transform: "rotate(-3deg)" // Counter-rotate to stay straight relative to screen
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  {/* Subtle pattern or gradient inside */}
                  <div className="absolute inset-0 bg-white/10" />

                  <div className="relative z-10 flex flex-col">
                    {/* Decorative piston bars */}
                    <div className="flex gap-1 mb-3">
                      <div className="w-1.5 h-4 bg-white/90 rounded-sm" />
                      <div className="w-1.5 h-5 bg-white/90 rounded-sm" />
                      <div className="w-1.5 h-4 bg-white/90 rounded-sm" />
                    </div>

                    {infoboxTitle && (
                      <h4
                        className="text-white font-serif font-bold text-lg md:text-xl mb-1 drop-shadow-sm break-words"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                      >
                        {infoboxTitle}
                      </h4>
                    )}
                    {infoboxSubtitle && (
                      <p className="text-white/80 font-sans text-[10px] md:text-xs uppercase tracking-[0.15em] font-semibold break-words">
                        {infoboxSubtitle}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
          
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ActiveEventSlide
