import React, { lazy, Suspense } from "react"
import { HashRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import DetailPage from "./pages/DetailPage"
import AdminPage from "./pages/AdminPage"
import StructuredData from "./components/SEO/StructuredData"
import "./styles/index.css"

// Lazy load heavy game components for better performance
const PuzzleGamePage = lazy(() => import("./pages/PuzzleGamePage"))
const MemoryGamePage = lazy(() => import("./pages/MemoryGamePage"))

// Loading fallback component
const GameLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
      <p className="text-amber-800 font-medium">Laden...</p>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <div className="App">
        <StructuredData />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="/puzzle-game"
              element={
                <Suspense fallback={<GameLoadingFallback />}>
                  <PuzzleGamePage />
                </Suspense>
              }
            />
            <Route
              path="/memory-game"
              element={
                <Suspense fallback={<GameLoadingFallback />}>
                  <MemoryGamePage />
                </Suspense>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
export default App
