// src/pages/Dashboard.jsx
// Main page: SOS button, siren, SOS panel and live location tracking.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import SOSButton from "../components/SOSButton";
import TrackingToggle from "../components/TrackingToggle";
import Loader from "../components/Loader";
import useGeolocation from "../hooks/useGeolocation";
import useAlarm from "../hooks/useAlarm";
import { triggerSOS, resolveSOS, getSOSHistory } from "../services/api";
import "../styles/Dashboard.css";

// The "contact" value in whatsapp_links can be text or an object. Handle both.
function getContactName(contact) {
  if (!contact) return "Contact";
  if (typeof contact === "string") return contact;
  return contact.name || "Contact";
}

function getContactPhone(contact) {
  if (contact && typeof contact === "object") return contact.phone || "";
  return "";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { getPosition } = useGeolocation();
  const { play, stop, prime, alarmError } = useAlarm();

  const [activeSOS, setActiveSOS] = useState(null); // the running SOS event
  const [sosResult, setSosResult] = useState(null); // full answer of /api/sos/trigger
  const [sosLoading, setSosLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState("");

  // When the page opens, check if an SOS is still active (for example after a refresh)
  useEffect(() => {
    let cancelled = false;

    getSOSHistory(user.id)
      .then((data) => {
        if (cancelled) return;
        const events = data.sos_events || [];
        const running = events.find((event) => event.status === "active");
        if (running) setActiveSOS(running);
      })
      .catch(() => {
        // Not important, the page works without it
      });

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  // Called when the SOS button was held for 2 seconds
  const handleTrigger = async () => {
    if (sosLoading || activeSOS) return;

    setError("");
    setNotice("");
    setSuccess("");
    setSosLoading(true);

    // Step 1: get GPS. If it fails we still send the SOS without location.
    let coords = null;
    let gpsWarning = "";
    try {
      coords = await getPosition();
    } catch (err) {
      gpsWarning = `${err.message} The alert was sent without your location.`;
    }

    // Step 2: send the SOS to the backend
    try {
      const body = { user_id: user.id };
      if (coords) {
        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
      }

      const data = await triggerSOS(body);

      setActiveSOS(data.sos_event);
      setSosResult(data);

      // Step 3: play the siren
      play();

      // Show extra messages (for example "an SOS is already active")
      if (data.message && data.message !== "SOS triggered") {
        setNotice(data.message);
      } else if (gpsWarning) {
        setNotice(gpsWarning);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSosLoading(false);
    }
  };

  // "I am safe" button: stop the siren and close the SOS
  const handleSafe = async () => {
    if (!activeSOS) return;

    stop(); // silence first
    setResolving(true);
    setError("");

    try {
      await resolveSOS(activeSOS.id);
      setActiveSOS(null);
      setSosResult(null);
      setNotice("");
      setSuccess("Glad you are safe. The SOS alert has been closed.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(false);
    }
  };

  // Values used in the screen
  const status = sosLoading ? "sending" : activeSOS ? "active" : "idle";
  const whatsappLinks = sosResult?.notifications?.whatsapp_links || [];
  const telegram = sosResult?.notifications?.telegram;
  const telegramSent =
    telegram &&
    ["sent", "ok", "success"].includes(String(telegram.status).toLowerCase());
  const hasLocation =
    activeSOS && activeSOS.latitude != null && activeSOS.longitude != null;

  return (
    <>
      <Navbar />

      <main className="container dashboard">
        {/* Red banner while an SOS is running */}
        {activeSOS && (
          <div className="sos-banner" role="alert">
            SOS ACTIVE
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {notice && <div className="alert alert-info">{notice}</div>}
        {alarmError && <div className="alert alert-info">{alarmError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* SOS button */}
        <section className="card sos-center">
          <SOSButton onTrigger={handleTrigger} onHoldStart={prime} status={status} />
          {sosLoading ? (
            <Loader text="Sending SOS alert..." />
          ) : (
            <p className="text-muted mt-16 mb-0">
              {activeSOS
                ? "Your alert is active. Tap I am safe when you are safe."
                : "Press and hold the button for 2 seconds in an emergency."}
            </p>
          )}
        </section>

        {/* Panel shown while the SOS is active */}
        {activeSOS && (
          <section className="card sos-panel">
            <button
              type="button"
              className="btn btn-success btn-block"
              onClick={handleSafe}
              disabled={resolving}
            >
              {resolving ? <Loader small text="Closing alert..." /> : "I am safe"}
            </button>

            {telegram && (
              <div
                className={
                  telegramSent ? "alert alert-success mt-16" : "alert alert-info mt-16"
                }
              >
                {telegramSent
                  ? "Telegram alert sent."
                  : `Telegram alert status: ${telegram.status}`}
              </div>
            )}

            <p className="mt-16">
              {hasLocation ? (
                <>
                  Location sent with this alert:{" "}
                  <a
                    href={`https://www.google.com/maps?q=${activeSOS.latitude},${activeSOS.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </>
              ) : (
                <span className="text-muted">
                  No location was sent with this alert.
                </span>
              )}
            </p>

            {/* Contacts with WhatsApp buttons (only right after the trigger) */}
            {sosResult && (
              <>
                <h3>Alert your contacts</h3>
                {whatsappLinks.length === 0 ? (
                  <p className="text-muted mb-0">
                    No contacts to notify. <Link to="/contacts">Add contacts</Link>
                  </p>
                ) : (
                  <ul className="sos-contacts">
                    {whatsappLinks.map((item) => (
                      <li key={item.link} className="sos-contact">
                        <div>
                          <div className="sos-contact-name">
                            {getContactName(item.contact)}
                          </div>
                          {getContactPhone(item.contact) && (
                            <div className="sos-contact-phone">
                              {getContactPhone(item.contact)}
                            </div>
                          )}
                        </div>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success"
                        >
                          Open WhatsApp
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        )}

        {/* Live location */}
        <TrackingToggle />
      </main>
    </>
  );
}