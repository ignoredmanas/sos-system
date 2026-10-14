// src/components/SOSButton.jsx
// Big round SOS button. The user must press and hold for 2 seconds.
// A ring around the button fills up while holding.
//
// Props:
//   onTrigger   - function called when the 2 seconds are complete
//   onHoldStart - (optional) function called when the hold starts
//   status      - "idle" | "sending" | "active"

import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/SOSButton.css";

const HOLD_TIME = 2000; // 2 seconds in milliseconds
const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function SOSButton({ onTrigger, onHoldStart, status = "idle" }) {
  const [progress, setProgress] = useState(0); // from 0 to 1
  const holdingRef = useRef(false);
  const frameRef = useRef(null);
  const startTimeRef = useRef(0);
  const onTriggerRef = useRef(onTrigger);

  const isIdle = status === "idle";

  // Always keep the newest onTrigger function
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  // Stop the hold and reset the ring
  const cancelHold = useCallback(() => {
    holdingRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setProgress(0);
  }, []);

  // Stop the animation when the page is closed
  useEffect(() => {
    return () => {
      holdingRef.current = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Start holding: fill the ring until 2 seconds are done
  const startHold = () => {
    if (!isIdle || holdingRef.current) return;

    holdingRef.current = true;
    startTimeRef.current = performance.now();
    if (onHoldStart) onHoldStart();

    const step = () => {
      if (!holdingRef.current) return;

      const elapsed = performance.now() - startTimeRef.current;
      const value = Math.min(elapsed / HOLD_TIME, 1);
      setProgress(value);

      // Ring is full -> trigger the SOS
      if (value >= 1) {
        cancelHold();
        if (navigator.vibrate) navigator.vibrate(200);
        onTriggerRef.current();
        return;
      }

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
  };

  // Mouse or finger pressed (left button only)
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    startHold();
  };

  // Keyboard support: hold Space or Enter
  const handleKeyDown = (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      startHold();
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === " " || e.key === "Enter") cancelHold();
  };

  // Text inside the button
  let label = "SOS";
  if (status === "sending") label = "Sending...";
  if (status === "active") label = "ACTIVE";

  let hint = "";
  if (isIdle) hint = progress > 0 ? "Keep holding..." : "Hold 2 seconds";

  const buttonClass = `sos-button sos-${status}${progress > 0 ? " holding" : ""}`;

  return (
    <div className="sos-wrap">
      {/* Progress ring */}
      <svg className="sos-ring" viewBox="0 0 220 220" aria-hidden="true">
        <circle className="sos-ring-bg" cx="110" cy="110" r={RADIUS} />
        <circle
          className="sos-ring-progress"
          cx="110"
          cy="110"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>

      <button
        type="button"
        className={buttonClass}
        disabled={!isIdle}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="SOS button. Press and hold for 2 seconds to send an alert."
      >
        <span className="sos-label">{label}</span>
        <span className="sos-hint">{hint}</span>
      </button>
    </div>
  );
}