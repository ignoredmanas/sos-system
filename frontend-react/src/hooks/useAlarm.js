// src/hooks/useAlarm.js
// Plays a looping siren from /alarm.mp3 (file is in the public folder).
// Usage:
//   const { play, stop, prime, isPlaying, alarmError } = useAlarm();

import { useCallback, useEffect, useRef, useState } from "react";

export default function useAlarm() {
  const audioRef = useRef(null);
  const wantPlayingRef = useRef(false); // true while the siren should be on
  const [isPlaying, setIsPlaying] = useState(false);
  const [alarmError, setAlarmError] = useState("");

  // Create the audio object once. Stop and clean up when the page closes.
  useEffect(() => {
    const audio = new Audio("/alarm.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      wantPlayingRef.current = false;
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Start the siren
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    wantPlayingRef.current = true;
    try {
      audio.muted = false;
      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
      setAlarmError("");
    } catch {
      setIsPlaying(false);
      setAlarmError(
        "Could not play the siren. Check that public/alarm.mp3 exists and the sound is on."
      );
    }
  }, []);

  // Stop the siren
  const stop = useCallback(() => {
    const audio = audioRef.current;
    wantPlayingRef.current = false;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  // Call this inside a user tap or press (for example when the SOS hold starts).
  // It unlocks sound on phones, so the siren can start a few seconds later.
  const prime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || wantPlayingRef.current) return;

    audio.muted = true;
    audio
      .play()
      .then(() => {
        // Only pause if the real siren was not started in the meantime
        if (!wantPlayingRef.current) {
          audio.pause();
          audio.currentTime = 0;
        }
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  }, []);

  return { play, stop, prime, isPlaying, alarmError };
}