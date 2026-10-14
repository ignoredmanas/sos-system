// src/components/ProtectedRoute.jsx
// Sends the visitor to /login when no user is stored.

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // Not logged in -> go to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in -> show the page
  return children;
}