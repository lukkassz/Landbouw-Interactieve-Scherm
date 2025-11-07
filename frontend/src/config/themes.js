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
export const ACTIVE_THEME = "modern" // 'modern' or 'museum'

// Museum's official color palette - Exact colors from museum brand
const MUSEUM_COLORS = {
  // Primary colors
  linen: "#f3f2e9", // Cream/off-white - główne tło
  slate: "#657575", // Gray - tekst główny, nieaktywne elementy
  mist: "#a7b8b4", // Muted blue-green - nieaktywne elementy, tła
  sky: "#b5cbd1", // Light blue-gray - akcenty, tła
  olive: "#929d7c", // Olive green - akcenty, tła

  // Accent colors (warm tones)
  gold: "#c9a300", // Bright gold - główny akcent, interaktywne elementy
  amber: "#b48a0f", // Bronze gold - hover states, gradienty
  terracotta: "#ae5514", // Copper/burnt orange - główny akcent, interaktywne
  rust: "#89350a", // Rust orange - hover states, gradienty

  // Dark colors
  maroon: "#440f0f", // Dark red/burgundy - headery, tekst na jasnym tle
}

// Modern theme (YOUR beautiful design)
const MODERN_THEME = {
  name: "modern",

  // Backgrounds
  background: {
    primary: "from-blue-900/80 via-blue-700/70 to-cyan-600/60",
    overlay: "from-black/40 via-transparent to-blue-900/30",
    card: "bg-white/20",
    modal: "bg-gradient-to-br from-blue-900/95 via-blue-700/90 to-cyan-600/85",
    modalLight: "bg-slate-900/95",
  },

  // Text colors
  text: {
    primary: "text-white",
    secondary: "text-white/80",
    accent: "text-cyan-300",
    gradient: "from-cyan-300 via-blue-200 to-purple-300",
  },

  // Buttons & Interactive
  button: {
    primary: "from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600",
    secondary: "bg-gray-500/90 hover:bg-gray-600",
  },

  // Timeline cards
  timeline: {
    cardBg: "bg-white/20",
    cardBorder: "border-white/30",
    cardHover: "hover:border-cyan-400/60",
    line: "from-cyan-400 via-blue-400 to-purple-400",
  },

  // Virtual Guide
  guide: {
    avatarGradient: "from-cyan-400 via-blue-500 to-purple-500",
    bubbleBg: "bg-white/95",
    bubbleBorder: "border-cyan-300",
    bubbleText: "text-gray-800",
  },

  // Borders & Accents
  border: "border-white/30",
  accent: "cyan-400",

  // Raw colors for special cases
  colors: {
    primary: "#06b6d4", // cyan-500
    secondary: "#3b82f6", // blue-500
    tertiary: "#a855f7", // purple-500
  },
}

// Museum theme - Using exact museum brand colors
const MUSEUM_THEME = {
  name: "museum",

  // Backgrounds - museum palette
  background: {
    primary: "from-[#440f0f]/30 via-[#89350a]/25 to-[#ae5514]/20", // Maroon → Rust → Terracotta (reduced opacity)
    overlay: "from-[#440f0f]/15 via-transparent to-[#657575]/10", // Maroon → Slate (reduced opacity)
    card: "bg-[#f3f2e9]", // Linen (cream)
    modal:
      "bg-gradient-to-br from-[#440f0f]/98 via-[#89350a]/95 to-[#ae5514]/98", // Deep maroon → rust → terracotta
    modalLight: "bg-[#f3f2e9]", // Linen for left panel
  },

  // Text colors
  text: {
    primary: "text-white", // For dark backgrounds
    secondary: "text-white/85", // Secondary text on dark
    accent: "text-[#c9a300]", // Gold accent
    gradient: "from-[#c9a300] via-[#b48a0f] to-[#ae5514]", // Gold → Amber → Terracotta
    dark: "text-[#440f0f]", // Maroon for headers on light background
    darkSecondary: "text-[#657575]", // Slate for secondary text on light
  },

  // Buttons & Interactive
  button: {
    primary:
      "from-[#c9a300] to-[#ae5514] hover:from-[#b48a0f] hover:to-[#89350a]", // Gold → Terracotta, hover: Amber → Rust
    secondary: "bg-[#657575]/90 hover:bg-[#440f0f]", // Slate → Maroon
  },

  // Timeline cards
  timeline: {
    cardBg: "bg-[#f3f2e9]/95", // Linen with slight transparency
    cardBorder: "border-[#a7b8b4]/60", // Mist border
    cardHover: "hover:border-[#c9a300] hover:shadow-[#c9a300]/20", // Gold border and shadow
    line: "from-[#c9a300] via-[#b48a0f] to-[#ae5514]", // Gold → Amber → Terracotta
  },

  // Virtual Guide
  guide: {
    avatarGradient: "from-[#c9a300] via-[#ae5514] to-[#89350a]", // Gold → Terracotta → Rust
    bubbleBg: "bg-[#f3f2e9]", // Linen
    bubbleBorder: "border-[#c9a300]", // Gold
    bubbleText: "text-[#440f0f]", // Maroon for readability
  },

  // Borders & Accents
  border: "border-[#a7b8b4]/50", // Mist border
  accent: "[#c9a300]", // Gold

  // Raw colors for special cases
  colors: {
    primary: MUSEUM_COLORS.gold, // #c9a300
    secondary: MUSEUM_COLORS.terracotta, // #ae5514
    tertiary: MUSEUM_COLORS.rust, // #89350a
    background: MUSEUM_COLORS.linen, // #f3f2e9
    text: MUSEUM_COLORS.maroon, // #440f0f
    muted: MUSEUM_COLORS.slate, // #657575
  },
}

/**
 * Get active theme based on ACTIVE_THEME constant or URL parameter
 */
export const getTheme = () => {
  // Check URL parameter first
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search)
    const urlTheme = params.get("theme")

    if (urlTheme === "museum") return MUSEUM_THEME
    if (urlTheme === "modern") return MODERN_THEME
  }

  // Fall back to ACTIVE_THEME constant
  return ACTIVE_THEME === "museum" ? MUSEUM_THEME : MODERN_THEME
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
  const newTheme = currentTheme === "modern" ? "museum" : "modern"

  // Update URL parameter
  if (typeof window !== "undefined") {
    const url = new URL(window.location)
    url.searchParams.set("theme", newTheme)
    window.history.pushState({}, "", url)
    window.location.reload() // Reload to apply new theme
  }
}

// Export themes for direct access if needed
export const themes = {
  modern: MODERN_THEME,
  museum: MUSEUM_THEME,
}

// Export museum colors for reference
export { MUSEUM_COLORS }
