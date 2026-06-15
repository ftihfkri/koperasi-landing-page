import "./lib/sessionGuard";
import React from "react";
import { createRoot } from "react-dom/client";
import AdminDashboard from "./pages/admin/AdminDashboard";
const el = document.getElementById("admin-dashboard-root");
if (el) createRoot(el).render(<AdminDashboard />);
