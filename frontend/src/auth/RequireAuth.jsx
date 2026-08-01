import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function RequireAuth() {
  const { token, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-[13px] text-slate-400">Loading...</div>;
  }
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
}
