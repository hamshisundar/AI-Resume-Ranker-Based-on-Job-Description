import React from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export default function PrivateRoute({ children }) {
  const { user, authDisabled, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-700 gap-3 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden />
        <span className="text-sm font-medium">Loading session…</span>
        <span className="text-xs text-gray-500 text-center max-w-xs">
          If this never finishes, confirm the API is running and <code className="bg-gray-200 px-1 rounded">VITE_PROXY_TARGET</code> matches your Flask port.
        </span>
      </div>
    );
  }

  if (authDisabled || user) {
    return children;
  }

  return <Navigate to="/login" replace />;
}
