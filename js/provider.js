// Dashboard for specialists and space owners.
//   ?section=requests (default) -> booking requests made to ME
//   ?section=profile            -> specialist: edit my profile | owner: manage my spaces
import { getAll, getWhere, createItem, updateItem, deleteItem } from "./api.js";
import { requireRole, logout } from "./auth.js";
import { renderTable, handleActions, badge } from "./ui.js";
import { COMMISSION_RATE } from "./helpers.js";

// Only specialists and space owners can open this page.
const user = requireRole(["specialist", "owner"]);
const isSpecialist = user?.role === "specialist";

const section = new URLSearchParams(location.search).get("section") === "profile" ? "profile" : "requests";

const content = document.getElementById("dash-content");
const side = document.getElementById("dash-side");
const title = document.getElementById("dash-title");

// What is on screen (the click handler reads it).
const current = { rows: [], actions: [] };
let editing = null; // owner: the space being edited (or null)

// Constants for the profile forms.
const SPECIALTIES = ["Anxiety & stress", "Grief & loss", "Caregiving", "Relationships", "Life transitions", "Chronic illness"];
const AVAILABILITY = ["Today", "This week", "Next week"];
const SPACE_TYPES = ["Open conversation", "Low-pressure space", "Positive reflection", "Outdoor-friendly space", "Workshop space"];

const options = (values) => values.map((value) => `<option>${value}</option>`).join("");

// Fill a form with values: fillForm(form, { city: "Amman" }).
function fillForm(form, values) {
  Object.entries(values).forEach(([name, value]) => {
    if (form.elements[name]) form.elements[name].value = value;
  });
}

// ----- Left menu (label depends on role) -----
function renderSide() {
  const profileLabel = isSpecialist ? "My profile" : "My spaces";
  side.innerHTML = `
    <a class="brand" href="./index.html"><span class="brand-mark">W</span><span>Wanas</span></a>
    <a class="dash-link ${section === "requests" ? "dash-link--active" : ""}" href="provider.html">Booking requests</a>
    <a class="dash-link ${section === "profile" ? "dash-link--active" : ""}" href="provider.html?section=profile">${profileLabel}</a>
    <div class="dash-user">
      <strong>${user.name}</strong>
      <span>${isSpecialist ? "Specialist" : "Space owner"}</span>
      <button class="button button--secondary" id="logout-btn" type="button">Log out</button>
    </div>`;
  document.getElementById("logout-btn").addEventListener("click", logout);
}

// ---------- Section 1: booking requests made to me ----------

const requestActions = [
  {
    label: "Confirm",
    show: (b) => b.status === "Pending",
    run: async (b) => {
      await updateItem("bookings", b.id, { status: "Confirmed" });
      // If this booking is tied to an event, publish the event.
      if (b.eventId) await updateItem("events", b.eventId, { status: "Published" });
    },
  },
  {
    label: "Decline",
    show: (b) => b.status === "Pending",
    run: async (b) => {
      await updateItem("bookings", b.id, { status: "Declined" });
      // If this booking is tied to an event, mark the event as declined.
      if (b.eventId) await updateItem("events", b.eventId, { status: "Draft - venue declined" });
    },
  },
];

// Render the "Booking requests" section.
async function showRequests() {
  title.textContent = "Booking requests";

  // Load my profile (specialist) or my spaces (owner).
  const mine = isSpecialist
    ? await getWhere("specialists", { userId: user.id })
    : await getWhere("spaces", { ownerId: user.id });

  if (mine.length === 0) {
    content.innerHTML = `<div class="card table-card"><p>You have no ${isSpecialist ? "profile" : "spaces"} yet. <a href="provider.html?section=profile">${isSpecialist ? "Create your profile" : "Add your first space"}</a> to start receiving requests.</p></div>`;
    return;
  }

  // Load all bookings + users (to show the requester's name).
  const [bookings, users] = await Promise.all([getAll("bookings"), getAll("users")]);
  const myIds = mine.map((item) => String(item.id));

  // Filter bookings: only mine, only matching the right type.
  current.rows = bookings
    .filter((b) => b.type === (isSpecialist ? "specialist" : "space") && myIds.includes(String(b.targetId)))
    .map((b) => {
      const target = mine.find((item) => String(item.id) === String(b.targetId));
      const hours = Number(b.duration || 1);

      // Older sample bookings have no prices; compute a demo estimate from the listed value.
      const gross = Number(b.amount ?? (isSpecialist ? (target?.price || 0) : (target?.pricePerHour || 0) * hours));
      const rate = Number(b.commissionRate ?? COMMISSION_RATE);
      const commission = Number((b.platformCommission ?? gross * rate).toFixed(2));
      const net = Number((b.providerAmount ?? gross - commission).toFixed(2));

      return {
        ...b,
        requester: users.find((u) => String(u.id) === String(b.userId))?.name ?? "Unknown user",
        grossAmount: `${gross.toFixed(2)} JD`,
        commissionRateLabel: `${(rate * 100).toFixed(0)}%`,
        commissionAmount: `${commission.toFixed(2)} JD`,
        providerNet: `${net.toFixed(2)} JD`,
      };
    })
    .sort((a, b) => Number(b.status === "Pending") - Number(a.status === "Pending") || a.date.localeCompare(b.date));
  current.actions = requestActions;

  // Columns differ: specialists show "Session price", owners show "Space" + "Hours".
  const columns = isSpecialist
    ? [["Requested by", "requester"], ["Date", "date"], ["Time", "time"], ["Session price", "grossAmount"], ["Wanas commission", "commissionAmount"], ["Your estimated net", "providerNet"], ["Note", "note"], ["Status", "status"]]
    : [["Requested by", "requester"], ["Space", "targetName"], ["Date", "date"], ["Time", "time"], ["Hours", "duration"], ["Price", "grossAmount"], ["Wanas commission", "commissionAmount"], ["Your estimated net", "providerNet"], ["Status", "status"]];

  const count = (status) => current.rows.filter((b) => b.status === status).length;

  // Show stat cards + table.
  content.innerHTML = `
    <div class="stat-cards stat-cards--three">
      <div class="stat-card"><span>Pending</span><strong>${count("Pending")}</strong></div>
      <div class="stat-card"><span>Confirmed</span><strong>${count("Confirmed")}</strong></div>
      <div class="stat-card"><span>All requests</span><strong>${current.rows.length}</strong></div>
    </div>
    <div class="card table-card">
      <h2>Requests for: ${mine.map((item) => item.name || item.title).join(", ")}</h2>
      <p class="cost-note">Demo commission: 10% of the booking/session price. This is an estimate only; no money is collected or deducted in this frontend prototype. In a real platform, commission would be settled when a booking is paid.</p>
      ${renderTable(columns, current.rows, requestActions)}
    </div>`;
}

// ---------- Section 2a (specialist): my profile ----------

// Render the specialist's own profile form.
async function showSpecialistProfile(message = "") {
  title.textContent = "My profile";
  const [mine] = await getWhere("specialists", { userId: user.id });

  const statusLine = !mine
    ? "Create your profile to appear in the specialists list."
    : mine.status === "Verified"
      ? "Your profile is visible to everyone."
      : "Your profile will be visible to everyone after the admin verifies it.";

  content.innerHTML = `
    <form class="card admin-form" id="profile-form">
      <label class="field"><span>Professional title</span><input name="role" placeholder="e.g. Licensed therapist" required /></label>
      <label class="field"><span>Main specialty</span><select name="specialty">${options(SPECIALTIES)}</select></label>
      <label class="field"><span>Topics (separated by commas)</span><input name="topics" placeholder="Anxiety, stress, burnout" required /></label>
      <label class="field"><span>Availability</span><select name="availability">${options(AVAILABILITY)}</select></label>
      <label class="field"><span>Session price (JD)</span><input name="price" type="number" min="0" step="0.01" placeholder="e.g. 25" required /></label>
      <p class="cost-note">Wanas demo commission is 10% per paid session. Example: a 30 JD session means 3 JD commission and 27 JD estimated net before payment fees.</p>
      <button class="button" type="submit">Save profile</button>
    </form>
    <p class="form-message form-message--ok">${message}</p>
    <p>Status: ${mine ? badge(mine.status) : "Not created"} &nbsp; ${statusLine}</p>`;

  const form = document.getElementById("profile-form");
  if (mine) fillForm(form, mine);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.price = Number(data.price || 0);

    if (mine) {
      await updateItem("specialists", mine.id, data); // keep current status
    } else {
      await createItem("specialists", { ...data, name: user.name, sessions: 0, status: "Pending", userId: user.id });
    }
    showSpecialistProfile("Saved.");
  });
}

// ---------- Section 2b (owner): my spaces ----------

const spaceActions = [
  { label: "Edit", show: () => true, run: async (space) => { editing = space; } },
  {
    label: "Delete",
    show: () => true,
    run: async (space) => {
      if (!confirm("Delete this space?")) return;
      await deleteItem("spaces", space.id);
      if (editing && String(editing.id) === String(space.id)) editing = null;
    },
  },
];

// Render the "My spaces" section: form + table.
async function showSpaces(message = "") {
  title.textContent = "My spaces";
  current.rows = await getWhere("spaces", { ownerId: user.id });
  current.actions = spaceActions;

  content.innerHTML = `
    <form class="card admin-form" id="space-form">
      <label class="field"><span>Name</span><input name="title" required /></label>
      <label class="field"><span>Type</span><select name="type">${options(SPACE_TYPES)}</select></label>
      <label class="field"><span>City</span><input name="city" required /></label>
      <label class="field"><span>Address</span><input name="address" required /></label>
      <label class="field"><span>Capacity (people)</span><input name="capacity" type="number" min="1" required /></label>
      <label class="field"><span>Price per hour (JD, 0 = free)</span><input name="pricePerHour" type="number" min="0" required /></label>
      <label class="field"><span>Opening hours</span><input name="openHours" placeholder="9:00 AM – 9:00 PM" required /></label>
      <label class="field"><span>What is included (commas)</span><input name="amenities" placeholder="Wi-Fi, Parking" /></label>
      <label class="field"><span>Description</span><input name="description" required /></label>
      <button class="button" type="submit">${editing ? "Save changes" : "Add space"}</button>
      ${editing ? `<button class="button button--secondary" id="cancel-edit" type="button">Cancel</button>` : ""}
    </form>
    <p class="form-message form-message--ok">${message}</p>
    <div class="card table-card">
      ${renderTable([["Name", "title"], ["City", "city"], ["Capacity", "capacity"], ["Price (JD/h)", "pricePerHour"]], current.rows, spaceActions)}
    </div>`;

  const form = document.getElementById("space-form");
  if (editing) fillForm(form, { ...editing, amenities: editing.amenities.join(", ") });

  const cancel = document.getElementById("cancel-edit");
  if (cancel) cancel.addEventListener("click", () => { editing = null; showSpaces(); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(form));

    const data = {
      ...v,
      capacity: Number(v.capacity),
      pricePerHour: Number(v.pricePerHour),
      amenities: v.amenities.split(",").map((item) => item.trim()).filter(Boolean),
    };

    if (editing) {
      await updateItem("spaces", editing.id, data);
    } else {
      await createItem("spaces", { ...data, ownerId: user.id });
    }
    editing = null;
    showSpaces("Saved.");
  });
}

// ---------- Load the correct section ----------
async function load() {
  try {
    if (section === "requests") await showRequests();
    else if (isSpecialist) await showSpecialistProfile();
    else await showSpaces();
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p>Could not load the demo data. Please refresh the page and try again.</p>";
  }
}

if (user) {
  renderSide();
  handleActions(content, () => current, load);
  load();
}