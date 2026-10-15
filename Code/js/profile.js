// Profile page: shows my bookings, my groups, and the facilitator application.
import { getAll, getWhere, createItem, deleteItem } from "./api.js";
import { mountLayout ,renderTable, handleActions} from "./ui.js";
import { requireLogin } from "./auth.js";

mountLayout();

// Require a logged-in user; guests are redirected to login.
const user = requireLogin();
const content = document.getElementById("profile-content");

let bookings = [];

// Only bookings that are still Pending can be cancelled from here.
const actions = [
  {
    label: "Cancel request",
    show: (booking) => booking.status === "Pending",
    run: (booking) => deleteItem("bookings", booking.id),
  },
];

// Load the user's bookings + memberships, then render.
async function load() {
  try {
    const [myBookings, myMemberships, allGroups] = await Promise.all([
      getWhere("bookings", { userId: user.id }),
      getWhere("memberships", { userId: user.id }),
      getAll("groups"),
    ]);

    bookings = myBookings.sort((a, b) => b.date.localeCompare(a.date));

    const myGroups = allGroups.filter((group) =>
      myMemberships.some((membership) => String(membership.groupId) === String(group.id))
    );

    render(myGroups);
  } catch (error) {
    console.error(error);
    content.innerHTML = "<p>Could not load your demo profile. Please refresh the page and try again.</p>";
  }
}

// Render the whole page: header, bookings table, groups, facilitator form.
function render(myGroups) {
  const groupList = myGroups.length
    ? `<ul class="link-list">${myGroups
        .map((g) => `<li><a href="group-details.html?id=${g.id}">${g.title}</a><span>${g.topic} · ${g.city}</span></li>`)
        .join("")}</ul>`
    : `<p>You have not joined any group yet. <a href="groups.html">Find a group</a></p>`;

  content.innerHTML = `
    <div class="profile-head">
      <div class="person-avatar">${user.name[0].toUpperCase()}</div>
      <div>
        <h1>${user.name}</h1>
        <p>${user.email} · <span class="tag">${user.role}</span></p>
      </div>
    </div>

    <section class="panel">
      <h2>My bookings and reservations</h2>
      ${renderTable(
        [["Type", "type"], ["Name", "targetName"], ["Date", "date"], ["Time", "time"], ["Status", "status"]],
        bookings,
        actions
      )}
    </section>

    <section class="panel">
      <h2>My groups</h2>
      ${groupList}
    </section>

    ${user.role === "member" ? renderFacilitatorApplication() : ""}`;

  // Only members can apply to become facilitators.
  if (user.role === "member") bindFacilitatorApplication();
}

// One click listener for the "Cancel request" buttons.
handleActions(content, () => ({ rows: bookings, actions }), load);

// Load on first visit.
load();


// ---------- Facilitator application (members only) ----------

// Static HTML for the "Become a Facilitator" panel.
function renderFacilitatorApplication() {
  return `
    <section class="panel">
      <h2>Become a Facilitator</h2>
      <p>Want to lead a support group? Send an application to the Wanas admin for review.</p>
      <div id="facilitator-application-area"><p>Loading application status...</p></div>
    </section>`;
}

// Load the latest application and show the right state (form / pending / approved / rejected).
async function bindFacilitatorApplication() {
  const area = document.getElementById("facilitator-application-area");
  if (!area) return;

  const applications = await getWhere("facilitatorApplications", { userId: user.id });
  const latest = applications.sort((a, b) => Number(b.id) - Number(a.id))[0];

  // Already pending.
  if (latest && latest.status === "Pending") {
    area.innerHTML = `<p>Your application is <strong>Pending</strong>. The admin will review it.</p>`;
    return;
  }

  // Approved.
  if (latest && latest.status === "Approved") {
    area.innerHTML = `
      <p>Your application was approved. Please log out and log in again to open your Facilitator workspace.</p>
      <a class="button" href="organizer.html">Open Facilitator workspace</a>`;
    return;
  }

  // Rejected (or no application): show the form.
  area.innerHTML = `
    ${latest && latest.status === "Rejected" ? `<p>Your previous application was not approved. You can submit a new one.</p>` : ""}
    <form class="form-card" id="facilitator-application-form">
      <label class="field">
        <span>Proposed support group topic</span>
        <input name="proposedTopic" required maxlength="100" placeholder="e.g. Managing stress" />
      </label>
      <label class="field">
        <span>Why would you like to become a Facilitator?</span>
        <textarea name="reason" required rows="3" maxlength="600" placeholder="Tell us why you want to lead this group"></textarea>
      </label>
      <label class="field">
        <span>Relevant experience or interests</span>
        <textarea name="experience" rows="3" maxlength="600" placeholder="Share any relevant experience or interests"></textarea>
      </label>
      <label class="field">
        <span><input type="checkbox" name="guidelines" required /> I agree to follow Wanas community guidelines.</span>
      </label>
      <p class="form-message" id="facilitator-application-message"></p>
      <button class="button button--primary" type="submit">Submit application</button>
    </form>`;

  document.getElementById("facilitator-application-form").addEventListener("submit", submitApplication);
}

// Create a new facilitator application and show the pending state.
async function submitApplication(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);

  await createItem("facilitatorApplications", {
    userId: user.id,
    applicantName: user.name,
    applicantEmail: user.email,
    proposedTopic: String(data.get("proposedTopic")).trim(),
    reason: String(data.get("reason")).trim(),
    experience: String(data.get("experience") || "").trim(),
    status: "Pending",
    submittedAt: new Date().toISOString().slice(0, 10),
  });

  const area = document.getElementById("facilitator-application-area");
  area.innerHTML = `<p class="form-message form-message--ok">Your application was submitted successfully and is now Pending admin review.</p>`;
}