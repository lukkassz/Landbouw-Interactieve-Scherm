import { useEffect } from "react"

/**
 * DynamicTitle Component
 * Updates document title dynamically based on current page/event
 * Improves SEO by providing specific titles for different content
 */
export const DynamicTitle = ({ title, eventTitle, eventYear }) => {
  useEffect(() => {
    let newTitle = "AgriTimeline - Interactive Timeline"

    if (title) {
      // Use provided title directly
      newTitle = title
    } else if (eventTitle && eventYear) {
      // Create event-specific title
      newTitle = `${eventTitle} - AgriTimeline | ${eventYear}`
    } else if (eventTitle) {
      // Title without year
      newTitle = `${eventTitle} - AgriTimeline`
    }

    // Update document title
    document.title = newTitle

    // Update meta tags if available
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && eventTitle) {
      metaDescription.setAttribute(
        "content",
        `Discover ${eventTitle} (${eventYear || ""}) - ${metaDescription.getAttribute("content")}`
      )
    }

    // Cleanup: restore default title on unmount
    return () => {
      document.title = "AgriTimeline - Interactive Timeline"
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          "AgriTimeline — an interactive timeline exploring a century of Dutch agricultural heritage (1925–2025). Discover the history of farming in the Netherlands."
        )
      }
    }
  }, [title, eventTitle, eventYear])

  return null
}

export default DynamicTitle

