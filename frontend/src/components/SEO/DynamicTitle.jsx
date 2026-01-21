import { useEffect } from "react"

/**
 * DynamicTitle Component
 * Updates document title dynamically based on current page/event
 * Improves SEO by providing specific titles for different content
 */
export const DynamicTitle = ({ title, eventTitle, eventYear }) => {
  useEffect(() => {
    let newTitle = "Fries Landbouwmuseum - Interactieve Tijdlijn"

    if (title) {
      // Use provided title directly
      newTitle = title
    } else if (eventTitle && eventYear) {
      // Create event-specific title
      newTitle = `${eventTitle} - Fries Landbouwmuseum | ${eventYear}`
    } else if (eventTitle) {
      // Title without year
      newTitle = `${eventTitle} - Fries Landbouwmuseum`
    }

    // Update document title
    document.title = newTitle

    // Update meta tags if available
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && eventTitle) {
      metaDescription.setAttribute(
        "content",
        `Ontdek ${eventTitle} (${eventYear || ""}) - ${metaDescription.getAttribute("content")}`
      )
    }

    // Cleanup: restore default title on unmount
    return () => {
      document.title = "Fries Landbouwmuseum - Interactieve Tijdlijn"
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          "Interactieve tijdlijn van 100 jaar Fries Landbouwmuseum geschiedenis (1925-2025). Ontdek de geschiedenis van het museum in Leeuwarden."
        )
      }
    }
  }, [title, eventTitle, eventYear])

  return null
}

export default DynamicTitle

