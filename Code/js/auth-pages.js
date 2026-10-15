// Login + Register pages (frontend demo).
import { login, homeFor, errorText } from "./auth.js";

// Detect which form is present
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("form-message");
    message.textContent = "";
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    try {
      const user = await login(email, password);
      location.href = homeFor(user.role);
    } catch (error) {
      message.textContent = errorText(error);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.getElementById("form-message");
    message.classList.add("form-message--ok");
    message.textContent = "Registration is a demo only. Please use a demo account from the login page.";
  });
}