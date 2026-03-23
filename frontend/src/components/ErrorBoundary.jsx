import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            background: "#f9fafb",
            color: "#111827",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ marginBottom: "1rem", color: "#4b5563" }}>
            The app hit a JavaScript error. Open the browser developer console (F12 → Console) for details.
          </p>
          <pre
            style={{
              fontSize: "0.8rem",
              overflow: "auto",
              padding: "1rem",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
            }}
          >
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
