// src/hooks/useGeolocation.js
// Helper hook around navigator.geolocation.
// Usage:
//   const { getPosition, error, permissionDenied } = useGeolocation();
//   const { latitude, longitude, accuracy } = await getPosition();

import { useCallback, useState } from "react";

// Turn a browser geolocation error into a simple message
function getErrorMessage(err) {
  if (err && err.code === 1) {
    return "Location permission denied. Please allow location access in your browser settings.";
  }
  if (err && err.code === 2) {
    return "Your location is not available right now. Check that GPS is on.";
  }
  if (err && err.code === 3) {
    return "Getting your location took too long. Please try again.";
  }
  return "Could not get your location.";
}

export default function useGeolocation() {
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Returns a Promise with { latitude, longitude, accuracy }.
  // You can pass options, for example getPosition({ timeout: 5000 }).
  const getPosition = useCallback((options = {}) => {
    return new Promise((resolve, reject) => {
      // Browser does not support geolocation
      if (!("geolocation" in navigator)) {
        const message = "This browser does not support location.";
        setError(message);
        reject(new Error(message));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setError("");
          setPermissionDenied(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (err) => {
          const message = getErrorMessage(err);
          setError(message);
          setPermissionDenied(err.code === 1);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          ...options,
        }
      );
    });
  }, []);

  // Clear the saved error message
  const clearError = useCallback(() => {
    setError("");
    setPermissionDenied(false);
  }, []);

  return { getPosition, error, permissionDenied, clearError };
}