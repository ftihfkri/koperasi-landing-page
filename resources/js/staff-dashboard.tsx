import "./lib/sessionGuard";
import React from "react";
import { createRoot } from "react-dom/client";
import StaffDashboard from "./pages/staff/StaffDashboard";
const el = document.getElementById("staff-dashboard-root");
if (el) createRoot(el).render(<StaffDashboard />);
