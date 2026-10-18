// Shared UI: cards, layout (header/footer), and table rendering.
import { getCurrentUser, logout } from "./auth.js";
import { countUnread, initials } from "./helpers.js";
// ---------- Cards ----------

export function renderGroupCard(group) {
  return `
    <article class="card group-card">
      <div class="image-placeholder image-placeholder--compact"></div>
      <div class="card-body">
        <span class="tag">${group.topic}</span>
        <h3>${group.title}</h3>
        <p>${group.description}</p>
        <div class="card-meta">
          <span>${group.members.toLocaleString()} members · ${group.city}</span>
          <a href="group-details.html?id=${group.id}">View group →</a>
        </div>
      </div>
    </article>`;
}

export function renderEventCard(event) {
  const date = new Date(event.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return `
    <article class="card event-card">
      <div class="date-block"><strong>${day}</strong><span>${month}</span></div>
      <div class="event-copy">
        <span class="tag">${event.type}</span>
        <h3>${event.title}</h3>
        <p>${weekday} · ${event.time} · Online</p>
      </div>
      <a class="button button--secondary" href="html/events.html">View details</a>
    </article>`;
}

export function renderEventCatalogCard(event, alreadyReserved = false) {
  const date = new Date(`${event.date}T12:00:00`);
  const mode = alreadyReserved ? "cancel" : "reserve";
  const label = alreadyReserved ? "Cancel reservation" : "Reserve a spot";
  return `
    <article class="catalog-card">
      <div class="catalog-card__top">
        <div><span class="tag">${event.type}</span><h3>${event.title}</h3></div>
        <div class="date-block" aria-label="${event.date}">
          <strong>${String(date.getDate()).padStart(2, "0")}</strong>
          <span>${date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span>
        </div>
      </div>
      <p class="catalog-card__meta"><span>${event.date}</span><span>${event.time}</span></p>
      <p>Hosted by ${event.host}. Take part in a supportive, welcoming session with the community.</p>
      <p class="catalog-card__meta"><span><strong>Venue:</strong> ${event.venueName || "Community venue"}</span><span>${event.venueAddress || "See venue details"}</span></p>
      <div class="catalog-card__meta"><span>${event.attendees} attending</span><span>In-person event</span></div>
      <div class="catalog-card__actions">
        <button class="button ${alreadyReserved ? "button--secondary" : ""}" type="button" data-event-id="${event.id}" data-mode="${mode}">
          ${label}
        </button>
      </div>
    </article>`;
}


export function renderSpaceCard(space) {
  return `
    <article class="catalog-card">
      <div>
        <span class="tag">${space.type}</span>
        <h3>${space.title}</h3>
      </div>
      <p>${space.description}</p>
      <div class="catalog-card__meta">
        <span>${space.city}, ${space.address}</span>
        <span>Up to ${space.capacity} people</span>
        <span>${space.pricePerHour === 0 ? "Free" : `${space.pricePerHour} JD / hour`}</span>
      </div>
      <div class="catalog-card__actions">
        <a class="button button--secondary" href="space-details.html?id=${space.id}">View space</a>
      </div>
    </article>`;
}

export function renderSpecialistCard(specialist) {
  return `
    <article class="catalog-card">
      <div class="catalog-card__top">
        <div class="person-avatar" aria-hidden="true">${initials(specialist.name)}</div>
        <span class="tag">Verified</span>
      </div>
      <div>
        <h3>${specialist.name}</h3>
        <p>${specialist.role}</p>
      </div>
      <div><span class="tag">${specialist.specialty}</span></div>
      <p>${specialist.topics}</p>
      <div class="catalog-card__meta">
        <span>${specialist.availability === "Not set" ? "Availability not set" : `Available: ${specialist.availability}`}</span>
        <span>${specialist.sessions} sessions</span>
      </div>
      <div class="catalog-card__actions">
        <a class="button button--secondary" href="specialist-details.html?id=${specialist.id}">View profile</a>
      </div>
    </article>`;
}

// ---------- Layout ----------

const navItems = [
  { label: "Home", href: "/index.html" },
  { label: "Groups", href: "/html/groups.html" },
  { label: "Events", href: "/html/events.html" },
  { label: "Specialists", href: "/html/specialists.html" },
  { label: "Community Spaces", href: "/html/spaces.html" },
  { label: "AI Assistant", href: "/html/assistant.html" },
];

const parentPage = {
  "group-details.html": "groups.html",
  "specialist-details.html": "specialists.html",
  "space-details.html": "spaces.html",
};

function currentPage() {
  const page = location.pathname.split("/").pop() || "./html/groups.html";
  return parentPage[page] || page;
}

function renderHeaderActions() {
  const user = getCurrentUser();
  if (!user) {
    return `
      <a class="button button--quiet" href="./html/login.html">Log in</a>`;
  }
 


const dashboards = {
  admin: "/html/admin.html",
  facilitator: "/html/organizer.html",
  specialist: "/html/provider.html",
  owner: "/html/provider.html",
};
const link = dashboards[user.role]
  ? `<a class="button button--secondary" href="${dashboards[user.role]}">Dashboard</a>`
  : `<a class="button button--secondary" href="/html/profile.html">My profile</a>`;


  const bell = user.role === "admin" ? ""
    : `<a class="button button--quiet" href="/html/notifications.html">Notifications <span class="notif-badge" id="notif-count" hidden></span></a>`;
  return `${bell}${link}<button class="button button--quiet" id="logout-btn" type="button">Log out</button>`;
}

function renderHeader() {
  const page = currentPage();
  const links = navItems.map((item) =>
    `<a class="nav-link ${item.href === page ? "nav-link--active" : ""}" href="${item.href}">${item.label}</a>`
  ).join("");
  return `
    <header class="site-header">
      <a class="brand" href="/index.html" aria-label="Wanas home">
        <span class="brand-mark" aria-hidden="true">W</span><span>Wanas</span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">${links}</nav>
      <div class="header-actions">${renderHeaderActions()}</div>
    </header>`;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-brand">
        <a class="brand brand--footer" href="./html/groups.html"><span class="brand-mark">W</span><span>Wanas</span></a>
        <p>A safer place to find support, share experiences, and feel understood.</p>
      </div>
      <div><strong>Explore</strong><a href="groups.html">Groups</a><a href="events.html">Events</a><a href="specialists.html">Specialists</a></div>
      <div><strong>Community</strong><a href="spaces.html">Community spaces</a><a href="assistant.html">AI assistant</a></div>
      <div><strong>Account</strong><a href="login.html">Log in</a><a href="register.html">Create account</a></div>
      <p class="footer-bottom">© 2026 Wanas · Privacy · Terms · Accessibility</p>
    </footer>`;
}

export function mountLayout() {
  document.getElementById("site-header").innerHTML = renderHeader();
  document.getElementById("site-footer").innerHTML = renderFooter();
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  showUnreadCount();
}

async function showUnreadCount() {
  const badge = document.getElementById("notif-count");
  const user = getCurrentUser();
  if (!badge || !user) return;
  try {
    const unread = await countUnread(user.id);
    if (unread > 0) { badge.textContent = unread; badge.hidden = false; }
  } catch (error) { console.error(error); }
}

// ---------- Tables ----------

export function badge(status) {
  return `<span class="badge badge--${String(status).toLowerCase()}">${status}</span>`;
}

export function renderTable(columns, rows, actions = []) {
  if (rows.length === 0) return "<p>Nothing here yet.</p>";
  const head = columns.map(([label]) => `<th>${label}</th>`).join("") + (actions.length ? "<th></th>" : "");
  const body = rows.map((row) => {
    const cells = columns.map(([, field]) =>
      `<td>${field === "status" ? badge(row.status) : row[field] ?? ""}</td>`
    ).join("");
    const buttons = actions.map((action, index) =>
      action.show(row)
        ? `<button class="button button--secondary button--small" type="button" data-action="${index}" data-id="${row.id}">${action.label}</button>`
        : ""
    ).join("");
    return `<tr>${cells}${actions.length ? `<td class="actions">${buttons}</td>` : ""}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

export function handleActions(container, getState, reload) {
  container.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { rows, actions } = getState();
    const action = actions[button.dataset.action];
    const row = rows.find((item) => String(item.id) === button.dataset.id);
    button.disabled = true;
    try {
      await action.run(row);
      await reload();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      button.disabled = false;
    }
  });
}