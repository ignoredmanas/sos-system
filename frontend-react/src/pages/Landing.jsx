// src/pages/Landing.jsx
// First page of the app. Public, no login needed.

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Landing.css";

// The steps shown under "How it works"
const steps = [
  {
    title: "Add trusted contacts",
    text: "Save up to 5 people who should be alerted in an emergency.",
  },
  {
    title: "Hold the SOS button",
    text: "Press and hold for 2 seconds. This avoids accidental alerts.",
  },
  {
    title: "Your contacts are alerted",
    text: "They get an alert with your location, and a loud siren plays on your phone.",
  },
  {
    title: "Tell them you are safe",
    text: "Tap the I am safe button to stop the siren and close the alert.",
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* Red top section */}
      <header className="landing-hero">
        <div className="landing-badge">SOS</div>
        <h1>Safety in one press</h1>
        <p>
          A cloud-based SOS system for women. Alert your trusted contacts with
          your live location, fast.
        </p>

        {/* Logged in users go straight to the dashboard */}
        <Link
          to={user ? "/dashboard" : "/login"}
          className="btn btn-block landing-cta"
        >
          {user ? "Open dashboard" : "Get started"}
        </Link>
      </header>

      {/* How it works */}
      <main className="container">
        <h2>How it works</h2>
        <ol className="landing-steps">
          {steps.map((step, index) => (
            <li key={step.title} className="card landing-step">
              <span className="landing-step-number">{index + 1}</span>
              <div>
                <h3 className="mb-0">{step.title}</h3>
                <p className="text-muted mb-0">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <footer className="landing-footer">
        Cloud-based SOS system for women's safety
      </footer>
    </div>
  );
}