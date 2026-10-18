// Home page: loads groups and the next event, then renders the cards.
import { getAll } from "./api.js";
import { mountLayout, renderGroupCard, renderEventCard } from "./ui.js";


mountLayout();

// Load groups + events, then fill the two placeholders in ./index.html.
async function loadHome() {
  const groupsBox = document.getElementById("home-groups");
  const eventBox = document.getElementById("home-event");

  try {
    // Fetch both at the same time (faster than one after the other).
    const [groups, events] = await Promise.all([getAll("groups"), getAll("events")]);

    // The next published event (or the latest one if all are in the past).
    const today = new Date().toISOString().slice(0, 10);
    const published = events
      .filter((event) => event.status === "Published")
      .sort((a, b) => a.date.localeCompare(b.date));
    const nextEvent = published.find((event) => event.date >= today) || published[published.length - 1];

    // Fill the two sections.
    groupsBox.innerHTML = groups.slice(0, 3).map(renderGroupCard).join("");
    eventBox.innerHTML = nextEvent ? renderEventCard(nextEvent) : "<p>No upcoming events.</p>";
  } catch (error) {
    console.error(error);
    groupsBox.innerHTML = "<p>Could not load the demo groups. Please refresh the page and try again.</p>";
  }
}

loadHome();