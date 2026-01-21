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
      name: "Fries Landbouwmuseum",
      description:
        "Interactieve tijdlijn van 100 jaar geschiedenis van het Fries Landbouwmuseum (1925-2025). Ontdek de geschiedenis van het museum in Leeuwarden.",
      url: window.location.origin,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Leeuwarden",
        addressRegion: "Friesland",
        addressCountry: "NL",
      },
      foundingDate: "1925",
      // Add more properties as needed
    }

    // Create script element
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.text = JSON.stringify(structuredData)
    script.id = "structured-data-museum"

    // Remove existing structured data if present
    const existing = document.getElementById("structured-data-museum")
    if (existing) {
      existing.remove()
    }

    // Add to document head
    document.head.appendChild(script)

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById("structured-data-museum")
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [])

  return null
}

export default StructuredData

