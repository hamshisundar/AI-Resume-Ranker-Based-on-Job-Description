import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import BackendStatus from "./BackendStatus";
import { useAuth } from "../auth/useAuth";
import { PRODUCT_SHORT } from "../lib/branding";

const navLink =
  "text-sm px-2.5 py-1.5 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";

export default function ProductShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    cn(
      navLink,
      isActive
        ? "bg-slate-100 text-slate-900 font-medium border border-slate-200/80"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    );

  return (
    <div className="min-h-screen text-slate-900 antialiased font-sans bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex h-[3.25rem] items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <div className="shrink-0 leading-tight min-w-0">
              <span className="text-sm font-semibold tracking-tight text-slate-900 truncate block">
                {PRODUCT_SHORT}
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-500 truncate max-w-[200px] md:max-w-xs">
                AI Resume Ranker
              </span>
            </div>
            <nav className="hidden sm:flex items-center gap-0.5" aria-label="Main">
              <NavLink to="/" end className={linkClass}>
                Screen
              </NavLink>
              <NavLink to="/jobs" className={linkClass}>
                Roles
              </NavLink>
              <NavLink to="/history" className={linkClass}>
                Screenings
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <nav className="flex sm:hidden items-center gap-1 text-xs">
              <NavLink to="/" end className="px-2 py-1 text-slate-600">
                Home
              </NavLink>
              <NavLink to="/jobs" className="px-2 py-1 text-slate-600">
                Jobs
              </NavLink>
              <NavLink to="/history" className="px-2 py-1 text-slate-600">
                List
              </NavLink>
            </nav>
            <BackendStatus />
            <span
              className="text-xs text-slate-500 truncate max-w-[160px] hidden md:inline"
              title={user?.email}
            >
              {user?.email}
            </span>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
