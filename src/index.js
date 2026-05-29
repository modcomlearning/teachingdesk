import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Suppress the React dev overlay for known network errors.
// These are handled by OfflineBanner and per-page error states — no overlay needed.
const NETWORK_MESSAGES = [
  "Connection lost",
  "Cannot reach the server",
  "Network Error",
  "Failed to fetch",
  "ERR_INTERNET_DISCONNECTED",
  "ERR_NETWORK",
  "ERR_CONNECTION_REFUSED",
  "Load failed",
];

function isNetworkMessage(msg) {
  return NETWORK_MESSAGES.some(m => String(msg).includes(m));
}

window.addEventListener("unhandledrejection", (e) => {
  const msg = e.reason?.message || e.reason || "";
  if (isNetworkMessage(msg)) e.preventDefault();
});

window.addEventListener("error", (e) => {
  const msg = e.message || e.error?.message || "";
  if (isNetworkMessage(msg)) e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
