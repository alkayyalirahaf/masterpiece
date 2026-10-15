// AI assistant (simulated): builds a personal plan from our own data.
// There is no real AI here; the "smart" part is simple matching rules.
import { getAll } from "./api.js";
import { renderGroupCard ,mountLayout} from "./ui.js";
import { fillSelect } from "./helpers.js";

mountLayout();

// Elements we need from the page.
const form = document.getElementById("plan-form");
const topicSelect = document.getElementById("topic");
const citySelect = document.getElementById("city");
const goalSelect = document.getElementById("goal");
const result = document.getElementById("plan-result");

// Which specialist specialty fits each group topic.
const specialtyFor = {
  Anxiety: "Anxiety & stress",
  "Stress & burnout": "Anxiety & stress",
  Grief: "Grief & loss",
  Caregiving: "Caregiving",
  Relationships: "Relationships",
  Loneliness: "Relationships",
  "Life changes": "Life transitions",
  "Chronic illness": "Chronic illness",
};

// Data loaded once, then reused on every plan.
let data = { groups: [], specialists: [], spaces: [], events: [] };

// Put the items from the chosen city first (keeps the others after them).
function cityFirst(items, city) {
  return [...items].sort((a, b) => Number(b.city === city) - Number(a.city === city));
}

// Build the plan: a list of steps + recommended groups.
function buildPlan(topic, city, goal) {
  // 1) Groups with the same topic (same city first).
  const groups = cityFirst(data.groups.filter((g) => g.topic === topic), city).slice(0, 2);

  // 2) A verified specialist for this topic.
  const specialist = data.specialists.find((s) => s.status === "Verified" && s.specialty === specialtyFor[topic]);

  // 3) A space in the city, and the next published event.
  const space = city ? data.spaces.find((s) => s.city === city) : data.spaces[0];
  const today = new Date().toISOString().slice(0, 10);
  const event = data.events
    .filter((e) => e.status === "Published" && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Build the steps.
  const steps = [];
  if (groups[0]) steps.push({ key: "group", html: `Join <a href="group-details.html?id=${groups[0].id}">${groups[0].title}</a> and listen or share at your own pace.` });
  if (specialist) steps.push({ key: "professional", html: `Book a session with <a href="specialist-details.html?id=${specialist.id}">${specialist.name}</a> (${specialist.role}).` });
  if (space) steps.push({ key: "meet", html: `Meet others in person at <a href="space-details.html?id=${space.id}">${space.title}</a> in ${space.city}.` });
  if (event) steps.push({ key: "event", html: `Attend <a href="events.html">${event.title}</a> on ${event.date}.` });

  // The step that matches the chosen goal goes first.
  steps.sort((a, b) => Number(b.key === goal) - Number(a.key === goal));

  return { groups, steps };
}

// Handle the form submit: build the plan and render it.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const { groups, steps } = buildPlan(topicSelect.value, citySelect.value, goalSelect.value);

  result.innerHTML = `
    <h2>Your plan</h2>
    <ol class="plan-steps">${steps.map((step) => `<li>${step.html}</li>`).join("")}</ol>
    ${groups.length ? `<h2>Groups we recommend</h2><div class="card-grid card-grid--two">${groups.map(renderGroupCard).join("")}</div>` : ""}`;
});

// Load data, then fill the topic + city dropdowns.
async function load() {
  try {
    const [groups, specialists, spaces, events] = await Promise.all([
      getAll("groups"), getAll("specialists"), getAll("spaces"), getAll("events"),
    ]);
    data = { groups, specialists, spaces, events };

    fillSelect(topicSelect, [...new Set(groups.map((g) => g.topic))]);
    fillSelect(citySelect, [...new Set(groups.map((g) => g.city))]);
  } catch (error) {
    console.error(error);
    result.innerHTML = "<p>Could not load the demo data. Please refresh the page and try again.</p>";
  }
}

load();