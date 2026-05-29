import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error) {
    // Detect network-related errors
    const msg = error?.message || "";
    const isNetwork =
      msg.includes("Network Error") ||
      msg.includes("Failed to fetch") ||
      msg.includes("ERR_INTERNET_DISCONNECTED") ||
      msg.includes("ERR_NETWORK") ||
      !navigator.onLine;

    return {
      hasError: true,
      message: isNetwork
        ? "Connection lost — check your internet and refresh the page."
        : "Something went wrong. Try refreshing the page.",
      isNetwork,
    };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "var(--bg)", color: "var(--text)", padding: 24, textAlign: "center",
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {this.state.isNetwork ? "📡" : "⚠️"}
          </div>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 26, marginBottom: 12 }}>
            {this.state.isNetwork ? "Connection Lost" : "Unexpected Error"}
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 15, maxWidth: 400, marginBottom: 28 }}>
            {this.state.message}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ justifyContent: "center" }}
          >
            🔄 Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
