// src/components/TrackingToggle.jsx
// ON/OFF switch for live location.
// When ON, the location is sent to the backend every 10 seconds.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import useGeolocation from "../hooks/useGeolocation";
import { sendLocation } from "../services/api";
import "../styles/TrackingToggle.css";

const SEND_EVERY = 10000; // 10 seconds

export default function TrackingToggle() {
  const { user } = useAuth();
  const { getPosition } = useGeolocation();
  const userId = user.id;

  const [tracking, setTracking] = useState(false);
  const [lastPoint, setLastPoint] = useState(null); // last position that was sent
  const [error, setError] = useState("");
  const busyRef = useRef(false); // stops two sends running at the same time

  // Runs when tracking is turned ON. The cleanup runs when it is turned OFF
  // or when the page is closed, so the timer never keeps running.
  useEffect(() => {
    if (!tracking) return undefined;

    let cancelled = false;

    const sendOnce = async () => {
      if (busyRef.current) return;
      busyRef.current = true;

      try {
        const pos = await getPosition();
        await sendLocation({
          user_id: userId,
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
        });
        if (!cancelled) {
          setLastPoint({ ...pos, time: new Date() });
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          // Permission denied: switch tracking OFF (message comes from useGeolocation)
          if (/permission denied/i.test(err.message)) {
            setTracking(false);
          }
        }
      } finally {
        busyRef.current = false;
      }
    };

    sendOnce(); // send once right away
    const timerId = setInterval(sendOnce, SEND_EVERY);

    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
  }, [tracking, userId, getPosition]);

  const handleToggle = () => {
    if (!tracking) setError("");
    setTracking(!tracking);
  };

  // Status text
  let statusText = "Live tracking is OFF.";
  if (tracking) {
    statusText = lastPoint
      ? `Live tracking is ON. Last sent at ${lastPoint.time.toLocaleTimeString()}.`
      : "Live tracking is ON. Getting your location...";
  }

  return (
    <section className="card tracking">
      <div className="tracking-row">
        <div>
          <h2 className="tracking-title">Live location</h2>
          <p className="text-muted mb-0">Share your location every 10 seconds.</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={tracking}
          aria-label="Live location tracking"
          className={tracking ? "switch on" : "switch"}
          onClick={handleToggle}
        >
          <span className="switch-knob" />
        </button>
      </div>

      <p className="tracking-status" aria-live="polite">
        {statusText}
      </p>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {lastPoint && (
        <p className="tracking-coords mb-0">
          Last position: {lastPoint.latitude.toFixed(5)},{" "}
          {lastPoint.longitude.toFixed(5)} (accuracy about{" "}
          {Math.round(lastPoint.accuracy)} m)
          <br />
          <a
            href={`https://www.google.com/maps?q=${lastPoint.latitude},${lastPoint.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
          </a>
        </p>
      )}
    </section>
  );
}