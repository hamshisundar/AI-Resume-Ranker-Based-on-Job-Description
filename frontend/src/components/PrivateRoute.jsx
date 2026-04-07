import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-slate-700 gap-3 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden />
        <span className="text-sm font-medium">Loading…</span>
      </div>
    );
  }

  if (user) {
    return children;
  }

  return <Navigate to="/login" replace />;
}
