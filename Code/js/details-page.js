// Details page for groups, spaces, and specialists.
import { getOne, getWhere, createItem, updateItem, deleteItem } from "./api.js";
import { mountLayout } from "./ui.js";
import { getCurrentUser } from "./auth.js";
import { initials, COMMISSION_RATE, calcCommission } from "./helpers.js";

mountLayout();

const TIMES_SPACE = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
const TIMES_SPECIALIST = ["10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

// ---------- Hero ----------

function renderHero(item, type) {
  const back = type === "group" ? "groups" : type === "space" ? "spaces" : "specialists";
  const crumb = type === "specialist" ? item.name : type === "space" ? `${item.city} / ${item.title}` : `${item.topic} / ${item.title}`;

  const meta =
    type === "specialist" ? `<span>${item.sessions} sessions</span><span>Available: ${item.availability}</span><span>Verified</span>` :
    type === "space"      ? `<span>${item.city}</span><span>Up to ${item.capacity} people</span><span>${item.pricePerHour === 0 ? "Free" : `${item.pricePerHour} JD / hour`}</span>` :
                            `<span>${item.members.toLocaleString()} members</span><span>${item.city}</span><span>Moderated daily</span>`;

  const thumb = type === "specialist"
    ? `<div class="person-avatar person-avatar--large">${initials(item.name)}</div>`
    : `<div class="image-placeholder"></div>`;

  const tag = type === "specialist" ? item.specialty : type === "space" ? item.type : item.topic;
  const h1 = item.title || item.name;
  const lede = type === "specialist" ? item.role : item.description;

  return `
    <p class="breadcrumb"><a href="${back}.html">${back[0].toUpperCase() + back.slice(1)}</a> / ${crumb}</p>
    <section class="group-hero">
      ${thumb}
      <div>
        <span class="tag">${tag}</span>
        <h1>${h1}</h1>
        <p class="lede">${lede}</p>
        <div class="inline-meta">${meta}</div>
      </div>
    </section>`;
}

// ---------- Content ----------

function renderGroupContent(g) {
  return `
    <section class="content-block">
      <h2>About this group</h2>
      <p>A welcoming space to share experiences, ask questions, or simply read along until you feel comfortable. Everyone here is going through something similar.</p>
      <h3>What you can expect</h3>
      <ul>
        <li>Kind, practical conversation</li>
        <li>Regular reflection prompts</li>
        <li>Resources reviewed by specialists</li>
      </ul>
    </section>`;
}

function renderSpaceContent(s) {
  return `
    <section class="content-block">
      <h2>About this space</h2>
      <p><strong>Address:</strong> ${s.address}, ${s.city}</p>
      <p><strong>Opening hours:</strong> ${s.openHours}</p>
      <h3>What is included</h3>
      <ul class="amenities">${s.amenities.map((a) => `<li class="tag">${a}</li>`).join("")}</ul>
    </section>`;
}

function renderSpecialistContent(s) {
  return `
    <section class="content-block">
      <h2>About this specialist</h2>
      <p>Sessions are one-to-one, private, and at your pace. Areas of experience:</p>
      <ul>${s.topics.split(",").map((t) => `<li>${t.trim()}</li>`).join("")}</ul>
    </section>`;
}

// ---------- Aside (forms) ----------

function renderGroupAside(group, membership) {
  const joined = membership !== null;
  return `
    <div class="card join-card">
      <h3>${joined ? "You are in this group" : "Join this group"}</h3>
      <p>${joined ? "You can leave at any time." : "Become part of the conversation or follow along quietly."}</p>
      <button class="button ${joined ? "button--secondary" : ""}" id="join-btn" type="button">
        ${joined ? "Leave group" : "Join group"}
      </button>
      <small>Your profile can remain private.</small>
    </div>
    <div class="card host-card">
      <h3>Group host</h3>
      <div class="person-row">
        <div class="avatar">${group.facilitator[0]}</div>
        <div><strong>${group.facilitator}</strong><p>Peer facilitator</p></div>
      </div>
    </div>`;
}

// Shared booking form fields: date, time, note + extras.
function renderBookingForm({ title, times, noteLabel, notePlaceholder, priceLine, extra = "" }) {
  const today = new Date().toISOString().slice(0, 10);
  return `
    <form class="card form-card" id="booking-form">
      <h3>${title}</h3>
      <p>The admin will confirm your request.</p>
      <label class="field"><span>Date</span><input type="date" id="booking-date" min="${today}" required /></label>
      <label class="field"><span>Time</span>
        <select id="booking-time" required>
          <option value="">Choose a time</option>
          ${times.map((t) => `<option>${t}</option>`).join("")}
        </select>
      </label>
      ${extra}
      <label class="field"><span>${noteLabel}</span>
        <textarea id="booking-note" placeholder="${notePlaceholder}"></textarea>
      </label>
      <p class="form-message" id="form-message" role="status"></p>
      ${priceLine ? `<p class="cost-note">${priceLine}</p>` : ""}
      <button class="button" type="submit">Send request</button>
    </form>`;
}

function renderSpaceAside(space) {
  const extra = `
    <label class="field"><span>Duration</span>
      <select id="booking-duration">
        <option value="1">1 hour</option><option value="2">2 hours</option>
        <option value="3">3 hours</option><option value="4">4 hours</option>
      </select>
    </label>
    <label class="field"><span>Number of people (max ${space.capacity})</span>
      <input type="number" id="booking-people" min="1" max="${space.capacity}" value="5" required />
    </label>
    <p class="cost-note" id="cost-note"></p>
    <p class="cost-note">No real payment is collected in this frontend demo.</p>`;
  return renderBookingForm({
    title: "Book this space",
    times: TIMES_SPACE,
    noteLabel: "Purpose of the meeting",
    notePlaceholder: "Example: monthly meetup for our group",
    priceLine: "",
    extra,
  });
}

function renderSpecialistAside(s) {
  return renderBookingForm({
    title: "Request a session",
    times: TIMES_SPECIALIST,
    noteLabel: "What would you like help with? (optional)",
    notePlaceholder: "Write a short note...",
    priceLine: `Session price: ${s.price} JD. No real payment is collected in this frontend demo.`,
  });
}

// ---------- Configs ----------

const CONFIGS = {
  group:      { resource: "groups",      renderContent: renderGroupContent,      renderAside: renderGroupAside },
  space:      { resource: "spaces",      renderContent: renderSpaceContent,      renderAside: renderSpaceAside },
  specialist: { resource: "specialists", renderContent: renderSpecialistContent, renderAside: renderSpecialistAside },
};

// ---------- Main ----------

const pageName = location.pathname.split("/").pop().replace("-details.html", "");
const config = CONFIGS[pageName];
const id = new URLSearchParams(location.search).get("id");
const box = document.getElementById(`${pageName}-box`) || document.getElementById(`${pageName}-content`);

let item = null;
let membership = null;
let busy = false;

async function render() {
  const user = getCurrentUser();

  if (pageName === "group" && user) {
    const found = await getWhere("memberships", { userId: user.id, groupId: id });
    membership = found[0] || null;
  }

  box.innerHTML = `
    ${renderHero(item, pageName)}
    <div class="detail-layout">
      ${config.renderContent(item)}
      <aside>${config.renderAside(item, membership)}</aside>
    </div>`;

  if (pageName === "group") {
    document.getElementById("join-btn").addEventListener("click", toggleJoin);
  } else if (pageName === "space") {
    document.getElementById("booking-form").addEventListener("submit", sendSpaceRequest);
    document.getElementById("booking-duration").addEventListener("change", () => showSpaceCost(item));
    showSpaceCost(item);
  } else if (pageName === "specialist") {
    document.getElementById("booking-form").addEventListener("submit", sendSpecialistRequest);
  }
}

// ---------- Group: join/leave ----------

async function toggleJoin() {
  if (busy) return;
  const user = getCurrentUser();
  if (!user) { location.href = "login.html"; return; }

  busy = true;
  document.getElementById("join-btn").disabled = true;

  try {
    if (membership) {
      await deleteItem("memberships", membership.id);
      item = await updateItem("groups", item.id, { members: item.members - 1 });
      membership = null;
    } else {
      membership = await createItem("memberships", { userId: user.id, groupId: item.id });
      item = await updateItem("groups", item.id, { members: item.members + 1 });
    }
    await render();
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
    const btn = document.getElementById("join-btn");
    if (btn) btn.disabled = false;
  } finally {
    busy = false;
  }
}

// ---------- Booking helpers ----------

function showSpaceCost(space) {
  const hours = Number(document.getElementById("booking-duration").value);
  const cost = space.pricePerHour * hours;
  document.getElementById("cost-note").textContent = cost === 0
    ? "This space is free."
    : `Estimated total: ${cost.toFixed(2)} JD for ${hours} hour${hours > 1 ? "s" : ""}.`;
}

function showMessage(text, ok = false) {
  const m = document.getElementById("form-message");
  if (!m) return;
  m.textContent = text;
  m.classList.toggle("form-message--ok", ok);
}

async function createBooking(payload, user, button, extraAfter) {
  button.disabled = true;
  try {
    const totals = calcCommission(payload.amount);
    await createItem("bookings", {
      ...payload,
      userId: user.id,
      status: "Pending",
      amount: totals.gross,
      commissionRate: COMMISSION_RATE,
      platformCommission: totals.commission,
      providerAmount: totals.net,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    document.getElementById("booking-form").reset();
    if (extraAfter) extraAfter();
    showMessage("Request sent! You can follow its status in your profile.", true);
  } catch (error) {
    console.error(error);
    showMessage("Could not send the request. Please refresh the page and try again.");
  } finally {
    button.disabled = false;
  }
}

// ---------- Space booking ----------

async function sendSpaceRequest(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) { location.href = "login.html"; return; }

  const date = document.getElementById("booking-date").value;
  const time = document.getElementById("booking-time").value;
  const duration = Number(document.getElementById("booking-duration").value);
  const people = Number(document.getElementById("booking-people").value);
  const note = document.getElementById("booking-note").value.trim();
  const button = event.target.querySelector("button");

  if (people < 1 || people > item.capacity) {
    showMessage(`This space holds up to ${item.capacity} people.`);
    return;
  }

  const taken = (await getWhere("bookings", { type: "space", targetId: item.id, date, time }))
    .filter((b) => b.status !== "Declined");
  if (taken.length > 0) {
    showMessage("This time is already requested. Please choose another time.");
    return;
  }

  await createBooking({
    type: "space", targetId: item.id, targetName: item.title,
    date, time, duration, people, note,
    amount: item.pricePerHour * duration,
  }, user, button, () => showSpaceCost(item));
}

// ---------- Specialist booking ----------

async function sendSpecialistRequest(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) { location.href = "login.html"; return; }

  const date = document.getElementById("booking-date").value;
  const time = document.getElementById("booking-time").value;
  const note = document.getElementById("booking-note").value.trim();
  const button = event.target.querySelector("button");

  const same = await getWhere("bookings", { userId: user.id, type: "specialist", targetId: item.id, date });
  if (same.length > 0) {
    showMessage("You already sent a request for this specialist on that date.");
    return;
  }

  await createBooking({
    type: "specialist", targetId: item.id, targetName: item.name,
    date, time, note,
    amount: item.price,
  }, user, button);
}

// ---------- Load ----------

async function load() {
  try {
    item = await getOne(config.resource, id);
    if (pageName === "specialist" && item.status !== "Verified") throw new Error("Not verified");
    document.title = `${item.title || item.name} - Wanas`;
    await render();
  } catch (error) {
    console.error(error);
    box.innerHTML = `<p>Not found. <a href="${pageName}s.html">Back</a></p>`;
  }
}

if (config) load();