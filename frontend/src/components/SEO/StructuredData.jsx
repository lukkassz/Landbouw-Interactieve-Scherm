import { useEffect } from "react"

/**
 * StructuredData Component
 * Adds Schema.org JSON-LD structured data for SEO
 * Implements Museum schema for better search engine understanding
 */
export const StructuredData = () => {
  useEffect(() => {
    // Create structured data object
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Museum",
      name: "AgriTimeline",
      description:
        "AgriTimeline — an interactive timeline exploring a century of Dutch agricultural heritage (1925–2025). Discover the history of farming in the Netherlands.",
      url: window.location.origin,
      address: {
        "@type": "PostalAddress",
        addressLocality: "the Netherlands",
        addressCountry: "NL",
      },
      foundingDate: "1925",
      // Add more properties as needed
    }

    // Create script element
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.text = JSON.stringify(structuredData)
    script.id = "structured-data-agritimeline"

    // Remove existing structured data if present
    const existing = document.getElementById("structured-data-agritimeline")
    if (existing) {
      existing.remove()
    }

    // Add to document head
    document.head.appendChild(script)

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById("structured-data-agritimeline")
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [])

  return null
}

export default StructuredData

