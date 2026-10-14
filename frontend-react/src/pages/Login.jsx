// src/pages/Login.jsx
// Login and Register on one page. The user switches with the two tabs.

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import "../styles/Login.css";

const emptyForm = { name: "", phone: "", email: "", password: "" };

// Check the form and return an object with error messages (empty = all good)
function validate(mode, form) {
  const errors = {};

  if (mode === "register" && form.name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }

  if (!/^\d{10}$/.test(form.phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  // Email is optional, but if typed it must look like an email
  if (
    mode === "register" &&
    form.email.trim() !== "" &&
    !/^\S+@\S+\.\S+$/.test(form.email.trim())
  ) {
    errors.email = "Please enter a valid email address.";
  }

  if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" or "register"
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({}); // errors for each field
  const [apiError, setApiError] = useState(""); // error message from backend
  const [loading, setLoading] = useState(false);

  // Already logged in -> go to the dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const isRegister = mode === "register";

  // Switch between the Login and Register tabs
  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setApiError("");
  };

  // Update the form when the user types
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Phone: keep digits only
    const cleaned = name === "phone" ? value.replace(/\D/g, "") : value;
    setForm((prev) => ({ ...prev, [name]: cleaned }));
    // Clear the error of this field while typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Check the inputs first
    const newErrors = validate(mode, form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name.trim(), form.phone, form.email, form.password);
      } else {
        await login(form.phone, form.password);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Show the message sent by the backend
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <Link to="/">SOS Safe</Link>
      </div>

      <div className="card">
        {/* Login / Register tabs */}
        <div className="login-tabs">
          <button
            type="button"
            className={mode === "login" ? "login-tab active" : "login-tab"}
            onClick={() => switchMode("login")}
            aria-pressed={mode === "login"}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "login-tab active" : "login-tab"}
            onClick={() => switchMode("register")}
            aria-pressed={mode === "register"}
          >
            Register
          </button>
        </div>

        <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>

        {apiError && (
          <div className="alert alert-error" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name (register only) */}
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "input-error" : ""}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>
          )}

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              placeholder="10 digit mobile number"
              value={form.phone}
              onChange={handleChange}
              className={errors.phone ? "input-error" : ""}
              aria-invalid={errors.phone ? "true" : "false"}
            />
            {errors.phone && <div className="field-error">{errors.phone}</div>}
          </div>

          {/* Email (register only, optional) */}
          {isRegister && (
            <div className="form-group">
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <div className="field-error">{errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <Loader
                small
                text={isRegister ? "Creating account..." : "Logging in..."}
              />
            ) : isRegister ? (
              "Create account"
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>

      <p className="text-center">
        <Link to="/">Back to home</Link>
      </p>
    </div>
  );
}