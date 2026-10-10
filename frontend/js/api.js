/* =====================================================
   api.js  -  Base URL, fetch helper and small shared helpers
   -----------------------------------------------------
   Load this file FIRST on every page (before the other js files):
     <script src="js/api.js"></script>

   What is inside:
     1. API_BASE_URL         - address of the Flask backend
     2. apiRequest()         - one function to call the backend
     3. api.get/post/delete  - short versions of apiRequest()
     4. User helpers         - save / read / remove the logged-in user
     5. Validation helpers   - phone and password checks
     6. UI helpers           - messages, loading button, date, maps link
   ===================================================== */


/* ---------- 1. Backend address ---------- */
// Change this one line if the backend runs on a different address.
const API_BASE_URL = "http://127.0.0.1:5000";

// Stop waiting for the server after 15 seconds
const REQUEST_TIMEOUT_MS = 15000;


/* ---------- 2. Main fetch helper ---------- */
/*
  apiRequest(path, method, body)
    path   : the endpoint, for example "/api/auth/login"
    method : "GET", "POST" or "DELETE"  (default is "GET")
    body   : a normal JavaScript object (only for POST). It is sent as JSON.

  It returns the JSON data from the backend when everything is OK.
  If something goes wrong it throws an Error. The error message is the
  text from the backend's "error" field, so the page can simply show
  error.message to the user.

  How to use it (inside an async function):
    try {
      const data = await apiRequest("/api/auth/login", "POST", { phone, password });
    } catch (error) {
      showMessage(messageBox, error.message, "error");
    }
*/
async function apiRequest(path, method = "GET", body = null) {
  // Settings for fetch()
  const options = {
    method: method,
    headers: { "Content-Type": "application/json" }
  };

  // Only send a body if we have one (GET and DELETE do not need it)
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  // AbortController lets us cancel the request if the server is too slow
  const controller = new AbortController();
  options.signal = controller.signal;
  const timer = setTimeout(function () {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(API_BASE_URL + path, options);
  } catch (error) {
    // The request never reached the server (or the server did not answer)
    if (error.name === "AbortError") {
      throw new Error("The server is taking too long to respond. Please try again.");
    }
    throw new Error("Cannot connect to the server. Check your internet and make sure the backend is running.");
  } finally {
    // The request has finished, so the timer is not needed any more
    clearTimeout(timer);
  }

  // Read the answer as JSON. If it is not JSON, data stays an empty object.
  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  // response.ok is false for status codes like 400, 401, 404, 409, 500
  if (!response.ok) {
    // The backend sends errors like {"error": "message"}
    throw new Error(data.error || "Something went wrong (error " + response.status + "). Please try again.");
  }

  return data;
}


/* ---------- 3. Short versions ---------- */
const api = {
  get: function (path) {
    return apiRequest(path, "GET");
  },
  post: function (path, body) {
    return apiRequest(path, "POST", body);
  },
  delete: function (path) {
    return apiRequest(path, "DELETE");
  }
};


/* ---------- 4. User helpers (localStorage key: "user") ---------- */

// Save the user object after login or register
function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

// Get the logged-in user object. Returns null if nobody is logged in.
function getUser() {
  const text = localStorage.getItem("user");
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    // The saved text is broken, so remove it
    localStorage.removeItem("user");
    return null;
  }
}

// Get only the user id (null if nobody is logged in)
function getUserId() {
  const user = getUser();
  return user ? user.id : null;
}

// Remove the saved user (used for logout)
function clearUser() {
  localStorage.removeItem("user");
}


/* ---------- 5. Validation helpers ---------- */

// Phone must be exactly 10 digits
function isValidPhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}

// Password must be at least 6 characters
function isValidPassword(password) {
  return password.length >= 6;
}

// Email is optional. An empty email is OK, otherwise it must look like an email.
function isValidEmail(email) {
  if (email === "") {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ---------- 6. UI helpers ---------- */

/*
  showMessage(element, text, type)
    element : a <div> where the message will appear
    text    : the message to show
    type    : "error", "success" or "info"  (default is "error")
  Example HTML:  <div id="message" class="hidden"></div>
*/
function showMessage(element, text, type = "error") {
  if (!element) {
    return;
  }
  element.className = "alert alert-" + type;
  element.textContent = text; // textContent is safe (it does not run HTML)
}

// Hide a message box
function hideMessage(element) {
  if (!element) {
    return;
  }
  element.textContent = "";
  element.className = "hidden";
}

/*
  setLoading(button, isLoading, loadingText)
  Disables a button and shows a spinner while the server is working.
    setLoading(btn, true, "Logging in...");   // start loading
    setLoading(btn, false);                   // stop loading
*/
function setLoading(button, isLoading, loadingText = "Please wait...") {
  if (!button) {
    return;
  }
  if (isLoading) {
    // Remember the original text so we can put it back later
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("loading");
  } else {
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
    button.disabled = false;
    button.classList.remove("loading");
  }
}

// Make a Google Maps link from latitude and longitude.
// Returns "" if the location is missing.
function getMapsLink(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return "";
  }
  return "https://www.google.com/maps?q=" + latitude + "," + longitude;
}

// Turn a date from the backend into easy text like "10 Oct 2026, 12:33 pm"
function formatDateTime(dateText) {
  if (!dateText) {
    return "-";
  }
  // Some backends send "2026-10-10 12:33:00". Add a "T" so every browser can read it.
  const date = new Date(String(dateText).replace(" ", "T"));
  if (isNaN(date.getTime())) {
    return dateText; // could not read it, so show it as it is
  }
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
