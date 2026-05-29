import { useEffect } from "react";

/**
 * In development, React shows a runtime error overlay for ALL unhandled
 * promise rejections — including intentional network errors we already
 * handle with the OfflineBanner. This component hides that overlay
 * when the error is a known network/connectivity issue.
 */
export default function SuppressDevOverlay() {
  useEffect(() => {
    const handler = (event) => {
      const msg = event.reason?.message || event.message || "";
      if (
        msg.includes("Connection lost") ||
        msg.includes("Cannot reach the server") ||
        msg.includes("Network Error") ||
        msg.includes("ERR_INTERNET_DISCONNECTED") ||
        msg.includes("ERR_NETWORK") ||
        msg.includes("Failed to fetch")
      ) {
        event.preventDefault();   // stops the dev overlay from appearing
        event.stopPropagation();
      }
    };

    // Covers both Promise rejections and window errors
    window.addEventListener("unhandledrejection", handler);
    window.addEventListener("error", handler);

    return () => {
      window.removeEventListener("unhandledrejection", handler);
      window.removeEventListener("error", handler);
    };
  }, []);

  return null;
}
