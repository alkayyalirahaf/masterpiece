// Frontend-only demo authentication. Accounts are read from localStorage sample data.
// The session is stored in sessionStorage, so it ends when the browser tab is closed.
import { getAll } from "./api.js";

// Read the logged-in user from sessionStorage (or null if nobody is logged in).
export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("currentUser"));
  } catch {
    return null;
  }
}

// Store only the fields the UI needs (never the password).
function saveSession(user) {
  const { id, name, email, role } = user;
  sessionStorage.setItem("currentUser", JSON.stringify({ id, name, email, role }));
}

// Clear the session and go back to the login page.
export function logout() {
  sessionStorage.removeItem("currentUser");
  location.href = "/html/login.html";
}

// Where to send the user after login, based on their role.
export function homeFor(role) {
  if (role === "admin") return "/html/admin.html";
  if (role === "facilitator") return "/html/organizer.html";
  if (role === "specialist" || role === "owner") return "/html/provider.html";
  return "/index.html"; 
}

// Check email + password against the sample users. Throws on failure.
export async function login(email, password) {
  const users = await getAll("users");
  const user = users.find(
    (item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password
  );
  if (!user) throw new Error("Wrong email or password. Use one of the demo accounts listed on this page.");
  if (user.status === "Pending") throw new Error("This demo account is pending approval. Try an Active demo account.");
  saveSession(user);
  return user;
}

// Guard for pages that require specific roles. Redirects to login on failure.
export function requireRole(roles) {
  const user = getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    location.href = "login.html";
    return null;
  }
  return user;
}

// Guard for pages that require any logged-in user.
export function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    location.href = "login.html";
    return null;
  }
  return user;
}

// Turn any thrown error into a readable message for the UI.
export function errorText(error) {
  return error?.message || "Something went wrong.";
}