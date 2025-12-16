# Exam Requirements Implementation Checklist

## MBO Frontend Development (FED, D1-K1)

**Last Updated:** 2025-01-XX  
**Status:** Validation Complete

---

## D1-K1-W1 – Ontwikkelt de hoofdstructuur van de frontend

### ✅ W1.1: Technical Solution Documentation

**Status:** PARTIALLY  
**Current State:**

- ✅ README.md has tech stack overview
- ✅ docs/STRUCTURE.md has project structure
- ❌ Missing formal "Programma van Eisen" / Technical Design Document

**TODO:**

- [ ] **Create `docs/TECHNICAL_DESIGN.md`** (30-45 min)
  - Add requirements analysis section
  - Document architecture decisions (React SPA, PHP REST API, MySQL)
  - Justify technology choices (React for interactivity, Vite for fast builds, Tailwind for rapid styling)
  - Add data flow diagram (text-based): Backend API → Frontend API Client → React Components → UI
  - Reference existing files: `frontend/src/services/api.js`, `backend/api/endpoints/get_events.php`

---

### ✅ W1.2: Development Environment Description

**Status:** YES  
**Current State:**

- ✅ README.md lines 47-69: Tech stack documented
- ✅ README.md lines 72-94: Setup instructions
- ✅ `frontend/package.json`: Dependencies listed
- ✅ `frontend/vite.config.js`: Build configuration

**Action:** No changes needed.

---

### ❌ W1.3: Wireframes

**Status:** NO  
**Current State:**

- ❌ No wireframe files found
- ❌ docs/ADMIN_PANEL_USER_STORY.md mentions mockups but they don't exist

**TODO:**

- [ ] **Create `docs/wireframes/` directory** (5 min)
- [ ] **Create `docs/wireframes/TIMELINE_PAGE.md`** (20-30 min)
  - Text-based wireframe showing:
    - Header area (MuseumHeadline)
    - Timeline container (horizontal scrollable)
    - Event cards with year, title, icon
    - Annotations: "Backend field: `year` → UI: Year label", "Backend field: `title` → UI: Card title"
- [ ] **Create `docs/wireframes/DETAIL_MODAL.md`** (20-30 min)
  - Show modal structure
  - Annotations: "Backend field: `description` → UI: Main description text", "Backend field: `event_media` → UI: Gallery images"
- [ ] **Create `docs/wireframes/ADMIN_PANEL.md`** (15-20 min)
  - Dashboard layout
  - Form structure for add/edit

**Alternative:** If you have visual wireframes (Figma, Sketch, etc.), add them to `docs/wireframes/` and reference in documentation.

---

### ⚠️ W1.4: Semantic HTML Structure

**Status:** PARTIALLY  
**Current State:**

- ✅ `<main>` used in `frontend/src/App.jsx` line 14
- ✅ `<nav>` used in `frontend/src/components/Timeline/ui/Breadcrumb.jsx` line 10
- ✅ `<section>` used in `frontend/src/components/Timeline/modals/SlidingDetailPanel.jsx` line 50
- ❌ Timeline component uses `<div>` instead of `<section>` for timeline sections
- ❌ Event cards use `<div>` instead of `<article>`
- ❌ Detail modal content uses `<div>` instead of `<article>`

**TODO:**

- [ ] **Update `frontend/src/components/Timeline/Timeline.jsx`** (15-20 min)
  - Line 845-849: Change `<div key={section.markerYear}>` to `<section key={section.markerYear}>`
  - Line 873: Change `<div className="flex flex-row...">` to keep as div (wrapper is fine)
  - Line 876-886: Change event card wrapper `<motion.div key={period.id}>` to `<motion.article key={period.id}>`
  - Add `role="article"` if motion.article doesn't work
- [ ] **Update `frontend/src/components/Timeline/modals/TimelineDetailModal.jsx`** (10-15 min)
  - Line 869: Change `<motion.div className="...MAIN CARD...">` to `<motion.article>`
  - Line 1223: Change `<div key={index} className="...cardBg...">` to `<section key={index}>` for event sections
- [ ] **Add proper heading hierarchy** (10 min)
  - Ensure Timeline has `<h1>` (currently in MuseumHeadline or IdleScreen)
  - Event cards should have `<h2>` for event titles
  - Detail modal should have `<h1>` for event title (already present at line 903, 1124)
  - Sections should have `<h3>` (already present at line 1227)

---

### ✅ W1.5: CSS Preprocessor (SCSS)

**Status:** YES  
**Current State:**

- ✅ `backend/styles/scss/styles.scss` exists (205 lines)
- ✅ Compiled CSS likely at `backend/styles/css/styles.css`
- ℹ️ Frontend uses Tailwind CSS (utility-first), which is acceptable

**Action:** No changes needed. SCSS requirement is fulfilled by backend admin panel.

---

### ❌ W1.6: User Test Plan & Report

**Status:** NO  
**Current State:**

- ❌ No user test documentation found

**TODO:**

- [ ] **Create `docs/USER_TEST_PLAN.md`** (30-45 min)
  - **Test Objectives:** Validate usability on touchscreen kiosk, test navigation, test games
  - **Target Users:** Museum visitors (ages 8-80), touchscreen users
  - **Test Scenarios:**
    1. Navigate timeline horizontally
    2. Open event detail modal
    3. Play puzzle game
    4. Play memory game
    5. View gallery images
  - **Success Criteria:** All tasks completed in < 2 minutes, no confusion, positive feedback
  - **Test Environment:** Touchscreen kiosk 1920x1080, or tablet simulation
- [ ] **Create `docs/USER_TEST_REPORT.md`** (45-60 min)
  - **Test Execution:** Date, participants (3-5 users), duration
  - **Found Issues:**
    - Example: "Users had difficulty finding puzzle button" → Fixed by making button more prominent
    - Example: "Timeline scrolling was not intuitive" → Fixed by adding swipe hints
  - **Severity Ratings:** Critical, High, Medium, Low
  - **Implemented Improvements:**
    - List each issue and how it was fixed
    - Reference code changes if applicable
  - **Before/After:** Describe improvements made

**Note:** If you haven't done user testing yet, do a quick test with 2-3 people and document it.

---

## D1-K1-W2 – Maakt een user interface responsive

### ⚠️ W2.1: Responsive Design Proposal

**Status:** PARTIALLY  
**Current State:**

- ✅ README.md line 7: Mentions "touchscreen kiosk (1920x1080)"
- ✅ README.md line 16: Mentions "Responsive Design - Werkt op desktop, tablet, en grote touchscreens"
- ✅ `frontend/src/utils/constants.js` lines 131-138: Breakpoints defined
- ❌ Missing formal proposal document with device specifications

**TODO:**

- [ ] **Create `docs/RESPONSIVE_DESIGN_PROPOSAL.md`** (20-30 min)
  - **Target Devices:**
    - Primary: Kiosk 1920x1080 (landscape)
    - Tablet: 768px-1024px (iPad, Android tablets)
    - Laptop: 1024px-1920px
    - Mobile: 320px-768px (optional, not primary)
  - **Grid Layout:**
    - Kiosk: Full-width horizontal timeline, cards in rows
    - Tablet: Horizontal timeline with smaller cards
    - Mobile: Vertical stack (if supported)
  - **Breakpoint Strategy:**
    - Use Tailwind breakpoints: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`
    - Reference: `frontend/src/utils/constants.js` lines 131-138
  - **Layout Changes:**
    - Timeline: Horizontal scroll on desktop/tablet, vertical on mobile (if implemented)
    - Modals: Full-screen on mobile, centered on desktop
    - Cards: 280px width on kiosk, responsive on smaller screens

---

### ✅ W2.2: Responsive Implementation

**Status:** YES  
**Current State:**

- ✅ Tailwind responsive classes used throughout (`md:`, `lg:`, `xl:`)
- ✅ Viewport meta tag: `frontend/index.html` line 7-9
- ✅ Responsive breakpoints: `frontend/src/utils/constants.js`
- ✅ Touch-optimized styles: `frontend/src/styles/index.css`

**Action:** No changes needed.

---

### ❌ W2.3: Responsivity Test Report

**Status:** NO  
**Current State:**

- ❌ No responsivity test report found

**TODO:**

- [ ] **Create `docs/RESPONSIVE_TEST_REPORT.md`** (45-60 min)
  - **Tested Devices/Viewports:**
    - Kiosk: 1920x1080 (Chrome DevTools)
    - Tablet: iPad 768x1024, iPad Pro 1024x1366
    - Laptop: 1366x768, 1920x1080
    - Mobile: iPhone 375x667, Android 360x640 (if applicable)
  - **Issues Found:**
    - Example: "Timeline cards overflow on 768px tablet" → Fixed with `min-w-[280px] md:min-w-[240px]`
    - Example: "Modal too wide on mobile" → Fixed with `w-[95vw] max-w-5xl`
  - **Improvements Implemented:**
    - List CSS/class changes made
    - Reference specific files and line numbers
  - **Performance Optimizations:**
    - Image lazy loading (if implemented)
    - Code splitting (Vite handles this)
    - Touch event optimizations
  - **Screenshots:** Add screenshots of different viewports (optional but recommended)

**Note:** Use Chrome DevTools responsive mode to test different viewports quickly.

---

## D1-K1-W3 – Past zoekmachineoptimalisatie (SEO) toe

### ❌ W3.1: Defined Keywords & SEO Tools

**Status:** NO  
**Current State:**

- ❌ No keyword definition document
- ❌ No SEO tools mentioned

**TODO:**

- [ ] **Create `docs/SEO_STRATEGY.md`** (20-30 min)
  - **Defined Keywords:**
    - Primary: "Fries Landbouwmuseum", "Landbouw museum Leeuwarden", "100 jaar museum geschiedenis"
    - Secondary: "Friese landbouw geschiedenis", "interactieve tijdlijn museum", "landbouwmuseum 1925-2025", "museum Leeuwarden"
    - Long-tail: "Fries Landbouwmuseum interactieve tentoonstelling", "geschiedenis Friese landbouw"
  - **Chosen SEO Tools:**
    - Google Lighthouse (built into Chrome DevTools)
    - Google Search Console (for search analytics)
    - Schema.org Markup Validator (https://validator.schema.org/)
    - W3C Markup Validator (https://validator.w3.org/)
  - **SEO Goals:** Improve findability for museum-related searches in Leeuwarden area

---

### ❌ W3.2: SEO Measurement Results

**Status:** NO  
**Current State:**

- ❌ No SEO measurement documentation

**TODO:**

- [ ] **Run Lighthouse SEO audit** (10 min)
  - Open app in Chrome
  - F12 → Lighthouse tab → SEO → Generate report
  - Take screenshot of results
- [ ] **Create `docs/SEO_MEASUREMENT_REPORT.md`** (30-45 min)
  - **Lighthouse SEO Score:** [Score]/100 (include screenshot)
  - **Core Web Vitals:**
    - LCP (Largest Contentful Paint): [value]
    - FID (First Input Delay): [value]
    - CLS (Cumulative Layout Shift): [value]
  - **SEO Checklist Results:**
    - Document title: ✅/❌
    - Meta description: ❌ (missing)
    - Heading hierarchy: ⚠️ (needs improvement)
    - Alt attributes: ✅ (present)
    - etc.
  - **Before/After:** If you make improvements, show before/after scores

---

### ⚠️ W3.3: SEO Code Optimizations

**Status:** PARTIALLY  
**Current State:**

- ✅ Page title: `frontend/index.html` line 10
- ✅ Meta charset: line 4
- ✅ Viewport meta: line 7-9
- ✅ Alt attributes: Present in multiple components
- ✅ Some ARIA attributes: Present in modals
- ❌ Missing meta description
- ❌ Missing Open Graph tags
- ❌ Missing Twitter Card tags
- ❌ Missing structured data (Schema.org JSON-LD)
- ❌ HTML lang="en" should be "nl"
- ❌ No dynamic page titles per route

**TODO:**

- [ ] **Update `frontend/index.html`** (15-20 min)
  - Line 2: Change `lang="en"` to `lang="nl"`
  - After line 9, add:
    ```html
    <meta
      name="description"
      content="Interactieve tijdlijn van 100 jaar Fries Landbouwmuseum geschiedenis (1925-2025). Ontdek de geschiedenis van het museum in Leeuwarden."
    />
    <meta
      name="keywords"
      content="Fries Landbouwmuseum, landbouw geschiedenis, Leeuwarden, interactieve tijdlijn, museum 1925-2025"
    />
    <meta
      property="og:title"
      content="Fries Landbouwmuseum - 100 Jaar Geschiedenis"
    />
    <meta
      property="og:description"
      content="Ontdek 100 jaar geschiedenis van het Fries Landbouwmuseum via een interactieve tijdlijn."
    />
    <meta property="og:image" content="/images/og-image.jpg" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://your-domain.com" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta
      name="twitter:title"
      content="Fries Landbouwmuseum - 100 Jaar Geschiedenis"
    />
    <meta
      name="twitter:description"
      content="Ontdek 100 jaar geschiedenis van het Fries Landbouwmuseum."
    />
    ```
- [ ] **Add Schema.org structured data** (20-30 min)
  - Create `frontend/src/components/SEO/StructuredData.jsx`
  - Add JSON-LD for Museum/Organization:
    ```jsx
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Museum",
      name: "Fries Landbouwmuseum",
      description: "Interactieve tijdlijn van 100 jaar geschiedenis",
      url: "https://your-domain.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Leeuwarden",
        addressCountry: "NL",
      },
    }
    ```
  - Add to `frontend/src/App.jsx` or `frontend/index.html`
- [ ] **Implement dynamic page titles** (30-45 min)
  - Install: `npm install react-helmet-async` (or use React's built-in `document.title`)
  - Create `frontend/src/components/SEO/DynamicTitle.jsx`:
    ```jsx
    import { useEffect } from "react"
    export const DynamicTitle = ({ title }) => {
      useEffect(() => {
        document.title = title || "Fries Landbouwmuseum - 100 Jaar Geschiedenis"
      }, [title])
      return null
    }
    ```
  - Use in `HomePage.jsx`, `DetailPage.jsx` with event-specific titles
- [ ] **Improve heading hierarchy** (10-15 min)
  - Ensure `<h1>` is used once per page (in Timeline or IdleScreen)
  - Event cards: Use `<h2>` for event titles
  - Detail modal: Keep `<h1>` for event title
  - Sections: Use `<h3>` (already done)

---

### ❌ W3.4: SEO Advice Report for Client

**Status:** NO  
**Current State:**

- ❌ No SEO advice report found

**TODO:**

- [ ] **Create `docs/SEO_ADVICE_REPORT.md`** (30-45 min)
  - **Executive Summary:** Brief overview of current SEO status and recommendations
  - **Current Status:**
    - Basic SEO implemented (title, viewport, alt attributes)
    - Missing: meta description, Open Graph tags, structured data
    - Lighthouse SEO score: [score]/100
  - **Recommendations (at least 2):**
    1. **Implement structured data (Schema.org)** - High priority
       - Improves search visibility with rich snippets
       - Helps Google understand content type (Museum)
       - Implementation: Add JSON-LD to HTML
       - Expected impact: Better search result appearance
    2. **Add meta descriptions and Open Graph tags** - High priority
       - Improves social media sharing appearance
       - Better click-through rates from search results
       - Implementation: Add to `index.html`
       - Expected impact: More social shares, better CTR
    3. **Optimize images with proper alt text** - Medium priority
       - Already partially done, but ensure all images have descriptive alt text
       - Implementation: Review all `<img>` tags
    4. **Implement dynamic page titles** - Medium priority
       - Better SEO for individual event pages
       - Implementation: Use React Helmet or document.title
  - **Implementation Priority:** High, Medium, Low
  - **Expected Impact:** Describe benefits (more visitors, better search ranking)
  - **Timeline:** Estimate implementation time for each recommendation

---

## Summary: Implementation Priority

### 🔴 High Priority (Required for Exam)

1. W1.3: Create wireframes (3 files, ~60 min total)
2. W1.6: Create user test plan & report (2 files, ~90 min total)
3. W2.3: Create responsive test report (1 file, ~60 min)
4. W3.1: Create SEO strategy document (1 file, ~30 min)
5. W3.2: Run Lighthouse & create measurement report (1 file, ~45 min)
6. W3.3: Complete SEO code optimizations (4 tasks, ~90 min total)
7. W3.4: Create SEO advice report (1 file, ~45 min)

### 🟡 Medium Priority (Improves Score)

1. W1.1: Complete technical design document (1 file, ~45 min)
2. W1.4: Improve semantic HTML (2 files, ~30 min)
3. W2.1: Complete responsive design proposal (1 file, ~30 min)

### 🟢 Low Priority (Nice to Have)

- None identified

**Total Estimated Time:** ~8-10 hours for all high-priority items

---

## Quick Start Guide

1. **Start with documentation** (easier, builds momentum):

   - W1.3 Wireframes (60 min)
   - W3.1 SEO Strategy (30 min)
   - W2.1 Responsive Proposal (30 min)

2. **Then do code changes**:

   - W3.3 SEO optimizations (90 min)
   - W1.4 Semantic HTML (30 min)

3. **Finally, testing & reports**:

   - W3.2 Lighthouse test (45 min)
   - W2.3 Responsive test (60 min)
   - W1.6 User test (90 min)
   - W3.4 SEO advice (45 min)

4. **Polish**:
   - W1.1 Technical design (45 min)

---

**Good luck with your exam! 🎓**
