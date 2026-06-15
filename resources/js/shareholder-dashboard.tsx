import "./lib/sessionGuard";
import React from "react";
import ReactDOM from "react-dom/client";
import ShareholderDashboard from "./pages/shareholder/ShareholderDashboard";

const el = document.getElementById("shareholder-dashboard-root");

if (el) {
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <ShareholderDashboard />
    </React.StrictMode>
  );
}