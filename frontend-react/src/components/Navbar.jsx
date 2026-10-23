// src/components/Navbar.jsx
// Top bar with the app name, page links and a logout button.

import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Clear the saved user and go to the login page
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // The link of the current page gets the "active" class
  const linkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  // Show only the first name
  const firstName = user && user.name ? user.name.split(" ")[0] : "";

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-top">
          <Link to="/dashboard" className="navbar-brand">
            SOS Safe
          </Link>

          <div className="navbar-user">
            {firstName && <span className="navbar-name">Hi, {firstName}</span>}
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <nav className="navbar-links" aria-label="Main">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/contacts" className={linkClass}>
            Contacts
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
        </nav>
      </div>
    </header>
  );
}