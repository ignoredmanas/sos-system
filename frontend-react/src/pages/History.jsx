// src/pages/History.jsx
// Past SOS events of the user: date and time, status and a Maps link.

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import { getSOSHistory } from "../services/api";
import "../styles/History.css";

// The backend may send times without a time zone (for example "2026-10-14 10:30:00").
// true  = treat such times as UTC and show them in your local time
// false = treat such times as local time already
// If the times on this page are wrong by 5 hours 30 minutes, change this value.
const TIMES_ARE_UTC = true;

// Turn the text from the backend into a Date object (or null if it is not valid)
function parseDate(value) {
  if (!value) return null;

  const raw = String(value).trim();
  let date;

  if (/GMT|UTC/i.test(raw)) {
    // Looks like "Wed, 14 Oct 2026 10:30:00 GMT" (has a time zone already)
    date = new Date(raw);
  } else {
    // Looks like "2026-10-14 10:30:00" or "2026-10-14T10:30:00"
    let text = raw.replace(" ", "T");
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
    if (!hasZone && TIMES_ARE_UTC) text += "Z";
    date = new Date(text);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

// Show a date and time in a simple format, for example "14 Oct 2026, 04:00 PM"
function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return "Unknown time";

  const day = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}, ${time}`;
}

// Time as a number, used for sorting
function getTime(value) {
  const date = parseDate(value);
  return date ? date.getTime() : 0;
}

export default function History() {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // change it to load the list again

  // Load the history when the page opens (and when Try again is pressed)
  useEffect(() => {
    let cancelled = false;

    getSOSHistory(user.id)
      .then((data) => {
        if (cancelled) return;
        // Newest event first
        const list = [...(data.sos_events || [])];
        list.sort(
          (a, b) => getTime(b.created_at) - getTime(a.created_at) || b.id - a.id
        );
        setEvents(list);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user.id, reloadKey]);

  // Try again button
  const handleRetry = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="history-header">
          <h1>SOS history</h1>
          {!loading && !error && (
            <span className="history-count">
              {events.length} {events.length === 1 ? "alert" : "alerts"}
            </span>
          )}
        </div>

        {loading ? (
          <Loader text="Loading history..." />
        ) : error ? (
          <div className="alert alert-error" role="alert">
            {error}
            <div className="history-retry">
              <button type="button" className="btn btn-outline" onClick={handleRetry}>
                Try again
              </button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted mb-0">
              No SOS alerts yet. Your past alerts will appear here.
            </p>
          </div>
        ) : (
          <ul className="history-list">
            {events.map((event) => {
              const isActive = event.status === "active";
              const isResolved = event.status === "resolved";
              const label = isActive
                ? "Active"
                : isResolved
                ? "Resolved"
                : event.status;
              const hasLocation = event.latitude != null && event.longitude != null;

              return (
                <li key={event.id} className="card history-item">
                  <div className="history-top">
                    <div className="history-date">{formatDateTime(event.created_at)}</div>
                    <span
                      className={
                        isActive
                          ? "history-badge history-badge-active"
                          : "history-badge history-badge-resolved"
                      }
                    >
                      {label}
                    </span>
                  </div>

                  {event.message && <p className="history-message">{event.message}</p>}

                  {isResolved && event.resolved_at && (
                    <p className="history-resolved">
                      Resolved: {formatDateTime(event.resolved_at)}
                    </p>
                  )}

                  {hasLocation ? (
                    <a
                      href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline history-map"
                    >
                      Open in Google Maps
                    </a>
                  ) : (
                    <p className="text-muted mb-0">No location was sent with this alert.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}