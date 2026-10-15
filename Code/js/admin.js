// Admin dashboard. Section comes from the URL: admin.html?section=users
import { getAll, updateItem, deleteItem } from "./api.js";
import { requireRole, logout } from "./auth.js";
import { renderTable, handleActions } from "./ui.js";

const user = requireRole(["admin"]);

const title   = document.getElementById("dash-title");
const content = document.getElementById("dash-content");
const side    = document.getElementById("dash-side");
const modal   = document.getElementById("details-modal");

// Current state on screen (click handler reads it).
const current = { rows: [], actions: [] };

// ---------- Reusable actions ----------

// Attach requester names to bookings (bookings only store userId).
async function withRequester(bookings) {
  const users = await getAll("users");
  return bookings.map((b) => ({
    ...b,
    requester: users.find((u) => String(u.id) === String(b.userId))?.name ?? "Unknown user",
  }));
}

const setStatus = (resource, label, from, to) => ({
  label,
  show: (row) => from.includes(row.status),
  run: (row) => updateItem(resource, row.id, { status: to }),
});

const remove = (resource) => ({
  label: "Delete",
  show: () => true,
  run: async (row) => {
    if (confirm("Delete this item? This cannot be undone."))
      await deleteItem(resource, row.id);
  },
});

// ---------- Details modal ----------

const humanize = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function showDetails(row) {
  const list = document.getElementById("details-list");
  list.innerHTML = "";
  Object.entries(row)
    .filter(([key]) => key !== "id" && key !== "password" && !key.endsWith("Id"))
    .forEach(([key, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = humanize(key);
      dd.textContent = Array.isArray(value) ? value.join(", ") : value === "" ? "-" : value;
      list.append(dt, dd);
    });
  modal.hidden = false;
}

document.getElementById("details-close").addEventListener("click", () => (modal.hidden = true));
modal.addEventListener("click", (e) => { if (e.target === modal) modal.hidden = true; });

const details = { label: "Details", show: () => true, run: async (row) => showDetails(row) };

// ---------- Sections ----------

const sections = {
  bookings: {
    title: "Bookings",
    resource: "bookings",
    columns: [["Requested by", "requester"], ["Type", "type"], ["For", "targetName"],
              ["Date", "date"], ["Time", "time"], ["Status", "status"]],
    actions: [
      details,
      setStatus("bookings", "Confirm", ["Pending"], "Confirmed"),
      setStatus("bookings", "Decline", ["Pending"], "Declined"),
      remove("bookings"),
    ],
  },
  users: {
    title: "Users",
    resource: "users",
    columns: [["Name", "name"], ["Email", "email"], ["Role", "role"],
              ["Joined", "createdAt"], ["Status", "status"]],
    actions: [
      details,
      setStatus("users", "Approve", ["Pending"], "Active"),
      { ...remove("users"), show: (row) => row.role !== "admin" },
    ],
  },
  groups: {
    title: "Groups",
    resource: "groups",
    columns: [["Title", "title"], ["Organizer", "facilitator"], ["Topic", "topic"],
              ["City", "city"], ["Members", "members"], ["Status", "status"]],
    actions: [details, remove("groups")],
  },
  events: {
    title: "Events",
    resource: "events",
    columns: [["Title", "title"], ["Type", "type"], ["Date", "date"],
              ["Host", "host"], ["Status", "status"]],
    actions: [
      details,
      setStatus("events", "Publish", ["Draft"], "Published"),
      setStatus("events", "Unpublish", ["Published"], "Draft"),
      remove("events"),
    ],
  },
  specialists: {
    title: "Specialists",
    resource: "specialists",
    columns: [["Name", "name"], ["Specialty", "specialty"], ["Sessions", "sessions"],
              ["Availability", "availability"], ["Status", "status"]],
    actions: [
      details,
      setStatus("specialists", "Verify", ["Pending", "Review"], "Verified"),
      remove("specialists"),
    ],
  },
  facilitatorApplications: {
    title: "Facilitator Applications",
    resource: "facilitatorApplications",
    columns: [["Applicant", "applicantName"], ["Email", "applicantEmail"],
              ["Proposed group topic", "proposedTopic"], ["Submitted", "submittedAt"],
              ["Status", "status"]],
    actions: [
      details,
      {
        label: "Approve",
        show: (row) => row.status === "Pending",
        run: async (row) => {
          await updateItem("facilitatorApplications", row.id, { status: "Approved" });
          await updateItem("users", row.userId, { role: "facilitator", status: "Active" });
        },
      },
      {
        label: "Reject",
        show: (row) => row.status === "Pending",
        run: async (row) => updateItem("facilitatorApplications", row.id, { status: "Rejected" }),
      },
    ],
  },
  spaces: {
    title: "Spaces",
    resource: "spaces",
    columns: [["Title", "title"], ["City", "city"], ["Capacity", "capacity"],
              ["Price (JD/h)", "pricePerHour"]],
    actions: [details, remove("spaces")],
  },
  reports: {
    title: "Reports",
    resource: "reports",
    columns: [["Code", "code"], ["Category", "category"], ["Submitted", "submitted"],
              ["Assigned to", "assignedTo"], ["Status", "status"]],
    actions: [
      details,
      setStatus("reports", "Resolve", ["Open", "Investigating"], "Resolved"),
    ],
  },
};

// ---------- Section loading ----------

let sectionName = new URLSearchParams(location.search).get("section") || "overview";
if (sectionName !== "overview" && !sections[sectionName]) sectionName = "overview";

function renderSide() {
  const links = [["overview", "Overview"], ...Object.entries(sections).map(([k, s]) => [k, s.title])];
  side.innerHTML = `
    <a class="brand" href="index.html"><span class="brand-mark">W</span><span>Wanas</span></a>
    ${links.map(([key, label]) =>
      `<a class="dash-link ${key === sectionName ? "dash-link--active" : ""}" href="admin.html?section=${key}">${label}</a>`
    ).join("")}
    <div class="dash-user">
      <strong>${user.name}</strong>
      <span>Platform admin</span>
      <button class="button button--secondary" id="logout-btn" type="button">Log out</button>
    </div>`;
  document.getElementById("logout-btn").addEventListener("click", logout);
}

async function showOverview() {
  const [users, groups, events, bookings, specialists, applications] = await Promise.all([
    getAll("users"), getAll("groups"), getAll("events"),
    getAll("bookings"), getAll("specialists"), getAll("facilitatorApplications"),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.status === "Published" && e.date >= today).length;
  const pendingBookings = await withRequester(bookings.filter((b) => b.status === "Pending"));
  const pendingUsers = users.filter((u) => u.status === "Pending").length;
  const pendingSpecialists = specialists.filter((s) => s.status !== "Verified").length;
  const pendingApplications = applications.filter((a) => a.status === "Pending").length;

  current.rows = pendingBookings;
  current.actions = sections.bookings.actions;

  const cards = [
    { label: "Users", value: users.length },
    { label: "Groups", value: groups.length },
    { label: "Upcoming events", value: upcoming },
    { label: "Pending bookings", value: pendingBookings.length, link: "bookings" },
    { label: "Accounts to approve", value: pendingUsers, link: "users" },
    { label: "Specialists to verify", value: pendingSpecialists, link: "specialists" },
    { label: "Facilitator applications", value: pendingApplications, link: "facilitatorApplications" },
  ];

  content.innerHTML = `
    <div class="stat-cards">
      ${cards.map((c) => c.link
        ? `<a class="stat-card stat-card--todo" href="admin.html?section=${c.link}"><span>${c.label}</span><strong>${c.value}</strong></a>`
        : `<div class="stat-card"><span>${c.label}</span><strong>${c.value}</strong></div>`
      ).join("")}
    </div>
    <div class="card table-card">
      <h2>Pending booking requests</h2>
      ${renderTable(sections.bookings.columns, pendingBookings, sections.bookings.actions)}
    </div>`;
}

async function showSection(section) {
  current.rows = await getAll(section.resource);
  if (section.resource === "bookings") current.rows = await withRequester(current.rows);
  current.actions = section.actions;

  content.innerHTML = `<div class="card table-card">${renderTable(section.columns, current.rows, section.actions)}</div>`;
}

async function load() {
  try {
    if (sectionName === "overview") return await showOverview();
    await showSection(sections[sectionName]);
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p>Could not load the demo data. Please refresh the page and try again.</p>";
  }
}

if (user) {
  title.textContent = sectionName === "overview" ? "Overview" : sections[sectionName].title;
  renderSide();
  handleActions(content, () => current, load);
  load();
}