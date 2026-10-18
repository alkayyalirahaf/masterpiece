// Notifications page: what's new in my groups.
import { getWhere, updateItem } from "./api.js";
import { mountLayout } from "./ui.js";
import { requireLogin } from "./auth.js";

mountLayout();

// Require a logged-in user; guests are redirected to login.
const user = requireLogin();
const content = document.getElementById("notifications-content");

let notifications = [];

// Render the whole page: heading + list + "mark all" button.
function render() {
  const unread = notifications.filter((n) => !n.read).length;

  const list = notifications.length
    ? `<ul class="notice-list">${notifications
        .map(
          (n) => `
        <li class="notice ${n.read ? "" : "notice--unread"}">
          <div>
            <strong>${n.message}</strong>
            <span>${n.createdAt.slice(0, 10)}</span>
          </div>
          <a href="${n.link}">View events</a>
        </li>`
        )
        .join("")}</ul>`
    : `<p>No notifications yet. Join a group to hear about its new events. <a href="groups.html">Find a group</a></p>`;

  content.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Stay up to date</p>
        <h1>Notifications</h1>
        <p class="lede">${unread} unread</p>
      </div>
      ${unread ? `<button class="button button--secondary" id="read-all" type="button">Mark all as read</button>` : ""}
    </div>
    ${list}`;

  // Attach the "mark all" handler only if the button exists.
  const readAll = document.getElementById("read-all");
  if (readAll) readAll.addEventListener("click", markAllRead);
}

// Mark every unread notification as read, then refresh.
async function markAllRead() {
  document.getElementById("read-all").disabled = true;

  try {
    for (const n of notifications.filter((item) => !item.read)) {
      await updateItem("notifications", n.id, { read: true });
    }
    await load();

    // Clear the badge in the header.
    const badge = document.getElementById("notif-count");
    if (badge) badge.hidden = true;
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
  }
}

// Load the user's notifications and render (newest first).
async function load() {
  try {
    const mine = await getWhere("notifications", { userId: user.id });
    notifications = mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    render();
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p>Could not load demo notifications. Please refresh the page and try again.</p>";
  }
}

if (user) load();