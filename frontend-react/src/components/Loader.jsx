// src/components/Loader.jsx
// Spinner with an optional text. Use small={true} inside buttons.

import "../styles/Loader.css";

export default function Loader({ text = "Loading...", small = false }) {
  return (
    <div
      className={small ? "loader loader-small" : "loader"}
      role="status"
      aria-live="polite"
    >
      <span className="loader-spinner" />
      {text && <span className="loader-text">{text}</span>}
    </div>
  );
}