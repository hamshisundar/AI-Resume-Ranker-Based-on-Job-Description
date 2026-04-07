import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext.jsx";
import PrivateRoute from "../components/PrivateRoute";
import Dashboard from "../pages/Dashboard";
import History from "../pages/History";
import HistoryDetail from "../pages/HistoryDetail";
import JobDetail from "../pages/JobDetail";
import Jobs from "../pages/Jobs";
import Login from "../pages/Login";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <History />
              </PrivateRoute>
            }
          />
          <Route
            path="/history/:id"
            element={
              <PrivateRoute>
                <HistoryDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <PrivateRoute>
                <Jobs />
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <PrivateRoute>
                <JobDetail />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
