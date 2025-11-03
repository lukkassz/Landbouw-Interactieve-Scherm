/**
 * Theme Configuration System
 *
 * Two themes available:
 * 1. 'modern' - Beautiful cyan/blue/purple gradients (YOUR design)
 * 2. 'museum' - Official museum colors (their... interesting palette)
 *
 * To switch themes:
 * - Change ACTIVE_THEME below
 * - Or add ?theme=museum to URL
 */

// ⚠️ CHANGE THIS TO SWITCH THEMES ⚠️
export const ACTIVE_THEME = 'modern' // 'modern' or 'museum'

// Museum's official color palette
const MUSEUM_COLORS = {
  sage: '#a7b8b4',      // Sage green
  lightBlue: '#b5cbd1',  // Light blue-gray
  olive: '#929d7c',      // Olive green
  gold: '#c9a300',       // Gold/mustard
  bronze: '#b48a0f',     // Bronze
  darkBrown: '#440f0f',  // Dark brown
  rust: '#89350a',       // Rust orange
  gray: '#657575',       // Medium gray
  cream: '#f3f2e9',      // Cream/off-white
  copper: '#ae5514'      // Copper/burnt orange
}

// Modern theme (YOUR beautiful design)
const MODERN_THEME = {
  name: 'modern',

  // Backgrounds
  background: {
    primary: 'from-blue-900/80 via-blue-700/70 to-cyan-600/60',
    overlay: 'from-black/40 via-transparent to-blue-900/30',
    card: 'bg-white/20',
    modal: 'bg-gradient-to-br from-blue-900/95 via-blue-700/90 to-cyan-600/85'
  },

  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-white/80',
    accent: 'text-cyan-300',
    gradient: 'from-cyan-300 via-blue-200 to-purple-300'
  },

  // Buttons & Interactive
  button: {
    primary: 'from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
    secondary: 'bg-gray-500/90 hover:bg-gray-600'
  },

  // Timeline cards
  timeline: {
    cardBg: 'bg-white/20',
    cardBorder: 'border-white/30',
    cardHover: 'hover:border-cyan-400/60',
    line: 'from-cyan-400 via-blue-400 to-purple-400'
  },

  // Virtual Guide
  guide: {
    avatarGradient: 'from-cyan-400 via-blue-500 to-purple-500',
    bubbleBg: 'bg-white/95',
    bubbleBorder: 'border-cyan-300',
    bubbleText: 'text-gray-800'
  },

  // Borders & Accents
  border: 'border-white/30',
  accent: 'cyan-400',

  // Raw colors for special cases
  colors: {
    primary: '#06b6d4',    // cyan-500
    secondary: '#3b82f6',  // blue-500
    tertiary: '#a855f7'    // purple-500
  }
}

// Museum theme (THEIR style from website)
// Clean, classic design matching frieslandbouwmuseum.nl
const MUSEUM_THEME = {
  name: 'museum',

  // Backgrounds
  background: {
    primary: 'from-brand-mist/80 via-brand-olive/70 to-brand-sky/60',
    overlay: 'from-brand-maroon/40 via-transparent to-brand-olive/30',
    card: 'bg-white',  // WHITE CARDS like their website!
    modal: 'bg-gradient-to-br from-brand-mist/95 via-brand-olive/90 to-brand-sky/85'
  },

  // Text colors
  text: {
    primary: 'text-brand-maroon',  // Dark text on white cards
    secondary: 'text-brand-slate',  // Gray for secondary text
    accent: 'text-brand-gold',
    gradient: 'from-brand-gold via-brand-amber to-brand-terracotta'
  },

  // Buttons & Interactive
  button: {
    primary: 'from-brand-gold to-brand-amber hover:from-brand-amber hover:to-brand-terracotta',
    secondary: 'bg-brand-slate/90 hover:bg-brand-slate'
  },

  // Timeline cards - WHITE, no glow!
  timeline: {
    cardBg: 'bg-white',  // Solid white, not transparent
    cardBorder: 'border-brand-slate/20',  // Subtle border
    cardHover: 'hover:border-brand-gold',  // Gold on hover
    line: 'from-brand-gold via-brand-amber to-brand-terracotta'
  },

  // Virtual Guide
  guide: {
    avatarGradient: 'from-brand-gold via-brand-amber to-brand-terracotta',
    bubbleBg: 'bg-white',  // White bubble like website
    bubbleBorder: 'border-brand-gold',
    bubbleText: 'text-brand-maroon'
  },

  // Borders & Accents
  border: 'border-brand-slate/20',  // Light gray borders
  accent: 'brand-gold',

  // Raw colors for special cases
  colors: {
    primary: MUSEUM_COLORS.gold,
    secondary: MUSEUM_COLORS.bronze,
    tertiary: MUSEUM_COLORS.copper
  }
}

/**
 * Get active theme based on ACTIVE_THEME constant or URL parameter
 */
export const getTheme = () => {
  // Check URL parameter first
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const urlTheme = params.get('theme')

    if (urlTheme === 'museum') return MUSEUM_THEME
    if (urlTheme === 'modern') return MODERN_THEME
  }

  // Fall back to ACTIVE_THEME constant
  return ACTIVE_THEME === 'museum' ? MUSEUM_THEME : MODERN_THEME
}

/**
 * Get current theme name
 */
export const getCurrentThemeName = () => {
  return getTheme().name
}

/**
 * Toggle between themes (for theme switcher button)
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentThemeName()
  const newTheme = currentTheme === 'modern' ? 'museum' : 'modern'

  // Update URL parameter
  if (typeof window !== 'undefined') {
    const url = new URL(window.location)
    url.searchParams.set('theme', newTheme)
    window.history.pushState({}, '', url)
    window.location.reload() // Reload to apply new theme
  }
}

// Export themes for direct access if needed
export const themes = {
  modern: MODERN_THEME,
  museum: MUSEUM_THEME
}

// Export museum colors for reference
export { MUSEUM_COLORS }
