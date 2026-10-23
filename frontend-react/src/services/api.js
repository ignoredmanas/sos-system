// src/services/api.js
// Helper functions to talk to the Flask backend.

// Base URL comes from the .env file (VITE_API_URL)
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

// Main helper: sends a request and returns the JSON answer.
// If the backend sends {"error": "message"}, we throw that message.
async function request(method, path, body) {
  const config = { method, headers: {} };

  // Only send a JSON body when we have one
  if (body !== undefined) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, config);
  } catch (err) {
    // Network problem (server is off, no internet, etc.)
    throw new Error(
      "Cannot reach the server. Please check your connection and try again."
    );
  }

  // Try to read the JSON body (it may be empty or not JSON)
  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  // Backend errors look like {"error": "message"}
  if (!response.ok) {
    throw new Error(data.error || `Request failed (status ${response.status})`);
  }

  return data;
}

// Short helpers for each HTTP method
export const apiGet = (path) => request("GET", path);
export const apiPost = (path, body) => request("POST", path, body);
export const apiDelete = (path) => request("DELETE", path);

// ---------- Auth ----------
export const registerUser = (data) => apiPost("/api/auth/register", data);
export const loginUser = (data) => apiPost("/api/auth/login", data);

// ---------- Contacts ----------
export const addContact = (data) => apiPost("/api/contacts", data);
export const getContacts = (userId) => apiGet(`/api/contacts/${userId}`);
export const deleteContact = (contactId) =>
  apiDelete(`/api/contacts/${contactId}`);

// ---------- Location ----------
export const sendLocation = (data) => apiPost("/api/location", data);
export const getLatestLocation = (userId) =>
  apiGet(`/api/location/${userId}/latest`);
export const getLocationHistory = (userId, limit = 50) =>
  apiGet(`/api/location/${userId}/history?limit=${limit}`);

// ---------- SOS ----------
export const triggerSOS = (data) => apiPost("/api/sos/trigger", data);
export const resolveSOS = (eventId) => apiPost(`/api/sos/${eventId}/resolve`, {});
export const getSOSHistory = (userId) => apiGet(`/api/sos/${userId}/history`);