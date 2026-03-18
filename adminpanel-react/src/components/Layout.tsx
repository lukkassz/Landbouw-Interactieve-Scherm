import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Plus } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
              AT
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                AgriTimeline
              </h1>
              <p className="text-[11px] text-slate-400 leading-none -mt-0.5">
                Admin Panel
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isHome && (
              <Link
                to="/event/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-700 text-white text-sm font-medium hover:bg-cyan-800 transition-colors"
              >
                <Plus size={16} />
                New Event
              </Link>
            )}
            {!isHome && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
