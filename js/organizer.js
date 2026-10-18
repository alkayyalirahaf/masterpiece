// Dashboard for group organizers.
//   ?section=groups (default) -> create, edit, and delete MY groups
//   ?section=events           -> create events for my groups (members are notified)
import { getWhere, getAll, createItem, updateItem, deleteItem } from "./api.js";
import { requireRole, logout } from "./auth.js";
import { renderTable, handleActions } from "./ui.js";
import { notifyGroupMembers , COMMISSION_RATE, calcCommission  } from "./helpers.js";

// Only facilitators can open this page.
const user = requireRole(["facilitator"]);

const section = new URLSearchParams(location.search).get("section") === "events" ? "events" : "groups";

const content = document.getElementById("dash-content");
const side = document.getElementById("dash-side");
const title = document.getElementById("dash-title");

// What is on screen (the click handler reads it).
const current = { rows: [], actions: [] };
let editing = null; // the group being edited (or null)

// Constants shared across the page.
const TOPICS = ["Anxiety", "Grief", "Caregiving", "Life changes", "Chronic illness", "Stress & burnout", "Loneliness", "Relationships"];
const EVENT_TYPES = ["Peer gathering", "Small group", "Specialist talk", "Workshop"];

// Build <option> tags for a <select>.
const options = (values) => values.map((value) => `<option>${value}</option>`).join("");

// Fill a form with values: fillForm(form, { city: "Amman" }).
function fillForm(form, values) {
  Object.entries(values).forEach(([name, value]) => {
    if (form.elements[name]) form.elements[name].value = value;
  });
}

// ----- Left menu -----
function renderSide() {
  side.innerHTML = `
    <a class="brand" href="./index.html"><span class="brand-mark">W</span><span>Wanas</span></a>
    <a class="dash-link ${section === "groups" ? "dash-link--active" : ""}" href="organizer.html">My groups</a>
    <a class="dash-link ${section === "events" ? "dash-link--active" : ""}" href="organizer.html?section=events">Events</a>
    <div class="dash-user">
      <strong>${user.name}</strong>
      <span>Group organizer</span>
      <button class="button button--secondary" id="logout-btn" type="button">Log out</button>
    </div>`;
  document.getElementById("logout-btn").addEventListener("click", logout);
}

// ---------- Section 1: my groups ----------

// Delete a group along with its memberships and its events (nothing left behind).
async function deleteGroup(group) {
  if (!confirm("Delete this group? Its events and memberships will be deleted too.")) return;

  for (const membership of await getWhere("memberships", { groupId: group.id })) await deleteItem("memberships", membership.id);
  for (const event of await getWhere("events", { groupId: group.id })) await deleteItem("events", event.id);
  await deleteItem("groups", group.id);

  if (editing && String(editing.id) === String(group.id)) editing = null;
}

const groupActions = [
  { label: "Edit", show: () => true, run: async (group) => { editing = group; } },
  { label: "Delete", show: () => true, run: deleteGroup },
];

// Render the "My groups" section: form + table.
async function showGroups(message = "") {
  title.textContent = "My groups";
  current.rows = await getWhere("groups", { ownerId: user.id });
  current.actions = groupActions;

  content.innerHTML = `
    <form class="card admin-form" id="group-form">
      <label class="field"><span>Group name</span><input name="title" required /></label>
      <label class="field"><span>Topic</span><select name="topic">${options(TOPICS)}</select></label>
      <label class="field"><span>City</span><input name="city" required /></label>
      <label class="field"><span>Description</span><input name="description" required /></label>
      <button class="button" type="submit">${editing ? "Save changes" : "Create group"}</button>
      ${editing ? `<button class="button button--secondary" id="cancel-edit" type="button">Cancel</button>` : ""}
    </form>
    <p class="form-message form-message--ok">${message}</p>
    <div class="card table-card">
      ${renderTable([["Group", "title"], ["Topic", "topic"], ["City", "city"], ["Members", "members"]], current.rows, groupActions)}
    </div>`;

  const form = document.getElementById("group-form");
  if (editing) fillForm(form, editing);

  const cancel = document.getElementById("cancel-edit");
  if (cancel) cancel.addEventListener("click", () => { editing = null; showGroups(); });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));

    if (editing) {
      await updateItem("groups", editing.id, values);
    } else {
      await createItem("groups", {
        ...values,
        facilitator: user.name,
        ownerId: user.id,
        members: 0,
        status: "Healthy",
        lastActivity: "Just now",
      });
    }
    editing = null;
    showGroups("Saved.");
  });
}

// ---------- Section 2: events of my groups ----------

const eventActions = [
  {
    label: "Delete",
    show: () => true,
    run: async (event) => {
      if (confirm("Delete this event?")) await deleteItem("events", event.id);
    },
  },
];

// Render the "Events" section: form + table.
async function showEvents(message = "") {
  title.textContent = "Events";
  const myGroups = await getWhere("groups", { ownerId: user.id });
  const spaces = (await getAll("spaces")).filter((space) => space.status !== "Pending");

  // Guard: need at least one group.
  if (myGroups.length === 0) {
    current.rows = [];
    content.innerHTML = `<div class="card table-card"><p>Create a group first, then you can add events to it. <a href="organizer.html">Create a group</a></p></div>`;
    return;
  }

  // Guard: need at least one space.
  if (spaces.length === 0) {
    content.innerHTML = `<div class="card table-card"><p>No community spaces are listed yet. An in-person event requires a space listed on the Spaces page.</p><a class="button button--secondary" href="spaces.html">Browse spaces</a></div>`;
    return;
  }

  // My events = events whose group belongs to me (with the group title added).
  const allEvents = await getAll("events");
  current.rows = allEvents
    .map((event) => ({ ...event, groupTitle: myGroups.find((g) => String(g.id) === String(event.groupId))?.title }))
    .filter((event) => event.groupTitle)
    .sort((a, b) => a.date.localeCompare(b.date));
  current.actions = eventActions;

  const today = new Date().toISOString().slice(0, 10);

  content.innerHTML = `
    <form class="card admin-form" id="event-form">
      <label class="field"><span>Group</span><select name="groupId">${myGroups.map((g) => `<option value="${g.id}">${g.title}</option>`).join("")}</select></label>
      <label class="field"><span>Event title</span><input name="title" required /></label>
      <label class="field"><span>Type</span><select name="type">${options(EVENT_TYPES)}</select></label>
      <label class="field"><span>Venue (required)</span><select name="spaceId" id="event-space" required><option value="">Choose a listed space</option>${spaces.map((space) => `<option value="${space.id}">${space.title} — ${space.city} — ${space.pricePerHour === 0 ? "Free" : `${space.pricePerHour} JD/hour`}</option>`).join("")}</select></label>
      <p class="cost-note" id="event-space-cost">Choose a venue to view the estimated cost.</p>
      <label class="field"><span>Date</span><input name="date" type="date" min="${today}" required /></label>
      <label class="field"><span>Time</span><input name="time" placeholder="6:00 PM – 7:00 PM" required /></label>
      <button class="button" type="submit">Publish event</button>
    </form>
    <p class="form-message form-message--ok">${message}</p>
    <div class="card table-card">
      ${renderTable([["Event", "title"], ["Group", "groupTitle"], ["Date", "date"], ["Time", "time"], ["Attendees", "attendees"]], current.rows, eventActions)}
    </div>`;

  // Live cost estimate when the venue changes.
  const venueSelect = document.getElementById("event-space");
  venueSelect.addEventListener("change", () => {
    const selected = spaces.find((space) => String(space.id) === venueSelect.value);
    document.getElementById("event-space-cost").textContent = selected
      ? `Estimated 1-hour cost: ${Number(selected.pricePerHour).toFixed(2)} JD. Final availability and price require owner confirmation.`
      : "Choose a venue to view the estimated cost.";
  });

  // Handle the event form submit.
  document.getElementById("event-form").addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const values = Object.fromEntries(new FormData(submitEvent.target));
    const group = myGroups.find((g) => String(g.id) === values.groupId);
    const space = spaces.find((item) => String(item.id) === values.spaceId);

    if (!space) {
      document.getElementById("event-space-cost").textContent = "Please choose a venue listed on the Spaces page.";
      return;
    }

    // Calculate the commission split (stored for the provider, not shown here).
    const totals = calcCommission(space.pricePerHour);

    // 1) Create the event in "Pending venue confirmation" state.
    const event = await createItem("events", {
      title: values.title,
      type: values.type,
      date: values.date,
      time: values.time,
      host: user.name,
      attendees: 0,
      status: "Pending venue confirmation",
      groupId: group.id,
      spaceId: space.id,
      venueName: space.title,
      venueAddress: `${space.address}, ${space.city}`,
      venuePricePerHour: Number(space.pricePerHour || 0),
      estimatedVenueCost: totals.gross,
      commissionRate: COMMISSION_RATE,
      estimatedPlatformCommission: totals.commission,
    });

    // 2) Create a pending venue booking so the space owner can confirm.
    await createItem("bookings", {
      userId: user.id,
      type: "space",
      targetId: space.id,
      targetName: space.title,
      eventId: event.id,
      eventTitle: event.title,
      date: values.date,
      time: values.time,
      duration: 1,
      people: 1,
      note: `Venue booking for event: ${event.title}`,
      status: "Pending",
      amount: totals.gross,
      commissionRate: COMMISSION_RATE,
      platformCommission: totals.commission,
      providerAmount: totals.net,
      createdAt: new Date().toISOString().slice(0, 10),
    });

    // 3) Notify group members about the new event (only after venue confirmation would be better,
    //    but this demo notifies immediately so the flow is visible).
    await notifyGroupMembers(group, event);

    showEvents(`Event saved as pending. ${space.title} must confirm the venue booking before the event can be published.`);
  });
}

// Load the correct section.
async function load() {
  try {
    if (section === "events") await showEvents();
    else await showGroups();
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p>Could not load the demo data. Refresh the page and try again.</p>";
  }
}

if (user) {
  renderSide();
  handleActions(content, () => current, load);
  load();
}