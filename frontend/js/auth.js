/* =====================================================
   auth.js  -  Register, login, logout and route guard
   -----------------------------------------------------
   Needs api.js to be loaded BEFORE this file:
     <script src="js/api.js"></script>
     <script src="js/auth.js"></script>

   Put these two lines at the END of <body> on every page.
   (login.html, dashboard.html, contacts.html, history.html)

   What is inside:
     1. Route guard   - send to login.html if nobody is logged in
     2. Logout        - remove the saved user and go to login.html
     3. Login/Register page code (tabs, validation, API calls)
     4. Start-up code - connects the buttons when the page opens
   ===================================================== */


/* ---------- 1. Route guard ---------- */

// These pages can be opened without logging in
const PUBLIC_PAGES = ["index.html", "login.html", ""];

// Get the file name of the current page, e.g. "dashboard.html"
function getCurrentPage() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

// If this is a private page and nobody is logged in, go to login.html
function requireLogin() {
  const isPublic = PUBLIC_PAGES.includes(getCurrentPage());
  if (!isPublic && !getUser()) {
    // replace() does not keep this page in the Back button history
    window.location.replace("login.html");
  }
}

// Run the guard immediately when this file loads
requireLogin();


/* ---------- 2. Logout ---------- */

// Remove the saved user and go back to the login page
function logout() {
  clearUser();
  window.location.replace("login.html");
}


/* ---------- 3. Login / Register page code ---------- */

// Show one input as wrong (red border) and put the cursor in it
function markInvalid(input) {
  input.classList.add("input-error");
  input.focus();
}

// Remove the red border from every input inside a form
function clearInvalid(form) {
  form.querySelectorAll("input").forEach(function (input) {
    input.classList.remove("input-error");
  });
}

// Show the "login" tab or the "register" tab
function showTab(tabName) {
  const isLogin = tabName === "login";

  document.getElementById("login-form").classList.toggle("hidden", !isLogin);
  document.getElementById("register-form").classList.toggle("hidden", isLogin);

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  tabLogin.setAttribute("aria-selected", String(isLogin));
  tabRegister.setAttribute("aria-selected", String(!isLogin));

  // Clear old messages when the user switches tab
  hideMessage(document.getElementById("message"));
}

// Called when the Login form is submitted
async function handleLogin(event) {
  event.preventDefault(); // stop the page from reloading

  const form = document.getElementById("login-form");
  const messageBox = document.getElementById("message");
  const phoneInput = document.getElementById("login-phone");
  const passwordInput = document.getElementById("login-password");
  const button = document.getElementById("login-btn");

  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  hideMessage(messageBox);
  clearInvalid(form);

  // Check the inputs BEFORE calling the backend
  if (!isValidPhone(phone)) {
    markInvalid(phoneInput);
    showMessage(messageBox, "Phone number must be exactly 10 digits.", "error");
    return;
  }
  if (!isValidPassword(password)) {
    markInvalid(passwordInput);
    showMessage(messageBox, "Password must be at least 6 characters.", "error");
    return;
  }

  setLoading(button, true, "Logging in...");
  try {
    const data = await apiRequest("/api/auth/login", "POST", {
      phone: phone,
      password: password
    });

    // Save the user and open the dashboard
    saveUser(data.user);
    window.location.href = "dashboard.html";
  } catch (error) {
    // error.message is the backend's "error" text
    showMessage(messageBox, error.message, "error");
    setLoading(button, false);
  }
}

// Called when the Register form is submitted
async function handleRegister(event) {
  event.preventDefault();

  const form = document.getElementById("register-form");
  const messageBox = document.getElementById("message");
  const nameInput = document.getElementById("register-name");
  const phoneInput = document.getElementById("register-phone");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  const button = document.getElementById("register-btn");

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  hideMessage(messageBox);
  clearInvalid(form);

  // Check the inputs BEFORE calling the backend
  if (name.length < 2) {
    markInvalid(nameInput);
    showMessage(messageBox, "Please enter your name.", "error");
    return;
  }
  if (!isValidPhone(phone)) {
    markInvalid(phoneInput);
    showMessage(messageBox, "Phone number must be exactly 10 digits.", "error");
    return;
  }
  if (!isValidEmail(email)) {
    markInvalid(emailInput);
    showMessage(messageBox, "Please enter a valid email or leave it empty.", "error");
    return;
  }
  if (!isValidPassword(password)) {
    markInvalid(passwordInput);
    showMessage(messageBox, "Password must be at least 6 characters.", "error");
    return;
  }

  // Email is optional, so we only send it when the user typed one
  const body = { name: name, phone: phone, password: password };
  if (email !== "") {
    body.email = email;
  }

  setLoading(button, true, "Creating account...");
  try {
    await apiRequest("/api/auth/register", "POST", body);

    // Account created: show the Login tab with the phone number already filled
    form.reset();
    showTab("login");
    document.getElementById("login-phone").value = phone;
    showMessage(messageBox, "Account created! Please login.", "success");
    document.getElementById("login-password").focus();
  } catch (error) {
    showMessage(messageBox, error.message, "error");
  } finally {
    setLoading(button, false);
  }
}


/* ---------- 4. Start-up code ---------- */
// Runs when the page has finished loading
document.addEventListener("DOMContentLoaded", function () {

  // --- On every private page: connect the Logout button (id="logout-btn") ---
  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  // --- Only on login.html: connect the tabs and forms ---
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  if (!loginForm || !registerForm) {
    return; // this is not the login page, so nothing more to do
  }

  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);
  document.getElementById("tab-login").addEventListener("click", function () {
    showTab("login");
  });
  document.getElementById("tab-register").addEventListener("click", function () {
    showTab("register");
  });

  // Allow digits only in the phone boxes
  ["login-phone", "register-phone"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  });

  // Remove the red border as soon as the user starts typing again
  document.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", function () {
      input.classList.remove("input-error");
    });
  });

  // index.html sends "login.html?tab=register" for the Register button
  const params = new URLSearchParams(window.location.search);
  if (params.get("tab") === "register") {
    showTab("register");
  }
});
