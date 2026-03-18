/**
 * Theme Configuration System
 *
 * Defines AgriTimeline's visual theme — Deep Teal + Warm Amber palette.
 */

// Active theme configuration
export const ACTIVE_THEME = "agri"

// AgriTimeline color palette — deep teal & warm amber
const AGRI_COLORS = {
  // Primary teals
  skyLight: "#f0f9ff",    // Sky-50 — lightest surface background
  mistBlue: "#bae6fd",    // Sky-200 — inactive, muted
  cyan:     "#22d3ee",    // Cyan-400 — highlights, accents
  teal:     "#0e7490",    // Cyan-700 — primary interactive
  deepTeal: "#0c6a7c",    // Cyan-800 — hover states
  ocean:    "#0f2d40",    // Custom dark teal — dark surfaces

  // Warm amber accents
  amber:    "#f59e0b",    // Amber-400 — gold shimmer, highlights
  harvest:  "#d97706",    // Amber-600 — secondary accent
  grain:    "#b45309",    // Amber-700 — hover on amber
  earth:    "#92400e",    // Amber-800 — tertiary, deep warm tone

  // Neutrals
  slate:    "#475569",    // Slate-600 — secondary text
  stone:    "#94a3b8",    // Slate-400 — muted text, borders
}

// AgriTimeline theme
const AGRI_THEME = {
  name: "agri",

  // Backgrounds
  background: {
    primary: "from-[#0f2d40]/40 via-[#0e7490]/30 to-[#0c6a7c]/25",         // Ocean → Teal → Deep Teal
    overlay: "from-[#0f2d40]/20 via-transparent to-[#475569]/10",            // Ocean → Slate
    card: "bg-[#f0f9ff]",                                                    // Sky surface
    modal: "bg-gradient-to-br from-[#0f2d40]/98 via-[#0e7490]/95 to-[#0c6a7c]/98", // Dark ocean → Teal
    modalLight: "bg-[#f0f9ff]",                                              // Sky-50 for left panel
  },

  // Text colors
  text: {
    primary: "text-white",                                         // On dark backgrounds
    secondary: "text-white/85",                                    // Secondary on dark
    accent: "text-[#f59e0b]",                                      // Amber gold
    gradient: "from-[#22d3ee] via-[#0e7490] to-[#f59e0b]",        // Cyan → Teal → Amber
    dark: "text-[#0f2d40]",                                        // Ocean on light backgrounds
    darkSecondary: "text-[#475569]",                               // Slate for secondary on light
  },

  // Buttons & Interactive
  button: {
    primary: "from-[#0e7490] to-[#d97706] hover:from-[#0c6a7c] hover:to-[#b45309]", // Teal → Amber, hover darker
    secondary: "bg-[#475569]/90 hover:bg-[#0f2d40]",                                  // Slate → Ocean
  },

  // Timeline cards
  timeline: {
    cardBg: "bg-[#f0f9ff]/95",                                // Sky with slight transparency
    cardBorder: "border-[#bae6fd]/60",                         // Mist blue border
    cardHover: "hover:border-[#0e7490] hover:shadow-[#0e7490]/20", // Teal border and shadow
    line: "from-[#0e7490] via-[#f59e0b] to-[#0c6a7c]",        // Teal → Amber → Deep Teal
  },

  // Virtual Guide
  guide: {
    avatarGradient: "from-[#0e7490] via-[#f59e0b] to-[#0c6a7c]", // Teal → Amber → Deep Teal
    bubbleBg: "bg-[#f0f9ff]",                                       // Sky
    bubbleBorder: "border-[#0e7490]",                               // Teal
    bubbleText: "text-[#0f2d40]",                                   // Ocean for readability
  },

  // Borders & Accents
  border: "border-[#bae6fd]/50",  // Mist blue border
  accent: "[#0e7490]",             // Teal

  // Raw colors for special cases
  colors: {
    primary: AGRI_COLORS.teal,     // #0e7490
    secondary: AGRI_COLORS.harvest, // #d97706
    tertiary: AGRI_COLORS.deepTeal, // #0c6a7c
    background: AGRI_COLORS.skyLight, // #f0f9ff
    text: AGRI_COLORS.ocean,        // #0f2d40
    muted: AGRI_COLORS.slate,       // #475569
    gold: AGRI_COLORS.amber,        // #f59e0b  ← used by timeline year markers & scrubber
    terracotta: AGRI_COLORS.harvest, // maps to amber for category border colors
  },
}

/**
 * Get active theme
 */
export const getTheme = () => {
  return AGRI_THEME
}

/**
 * Get current theme name
 */
export const getCurrentThemeName = () => {
  return "agri"
}

// Export themes for direct access
export const themes = {
  agri: AGRI_THEME,
}

// Export colors for reference
export { AGRI_COLORS }
