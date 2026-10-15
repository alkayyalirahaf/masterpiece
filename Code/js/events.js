// Events page: list + search + filters + reservations + cancellations.
import { getAll, createItem, updateItem, deleteItem } from "./api.js";
import { getCurrentUser } from "./auth.js";
import { renderEventCatalogCard ,mountLayout } from "./ui.js";
import { fillSelect } from "./helpers.js";

mountLayout();

// Elements we need from the page.
const searchInput = document.getElementById("search");
const typeSelect = document.getElementById("type-filter");
const dateSelect = document.getElementById("date-filter");
const list = document.getElementById("events-list");
const count = document.getElementById("results-count");
const message = document.getElementById("page-message");

// Loaded data.
let allEvents = [];
let allBookings = [];

// Find the current user's booking for a given event (or null).
function findMyBooking(eventId) {
  const user = getCurrentUser();
  if (!user) return null;
  return allBookings.find((booking) =>
    String(booking.userId) === String(user.id) &&
    booking.type === "event" &&
    String(booking.targetId) === String(eventId)
  ) || null;
}

// Apply search + filters, then re-render the list.
function showEvents() {
  const text = searchInput.value.trim().toLowerCase();
  const type = typeSelect.value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = allEvents.filter((event) => {
    const matchesText = `${event.title} ${event.type} ${event.host}`.toLowerCase().includes(text);
    const matchesType = type === "" || event.type === type;
    const matchesDate = dateSelect.value === "all" || new Date(`${event.date}T12:00:00`) >= today;
    return matchesText && matchesType && matchesDate;
  });

  count.textContent = `${result.length} ${result.length === 1 ? "event" : "events"}`;
  list.innerHTML = result.length
    ? result.map((event) => renderEventCatalogCard(event, !!findMyBooking(event.id))).join("")
    : "<p>No events match your search.</p>";

  // Attach a click handler to each action button.
  list.querySelectorAll("[data-event-id]").forEach((button) => {
    const mode = button.dataset.mode;
    button.addEventListener("click", () => {
      if (mode === "cancel") cancelReservation(button.dataset.eventId, button);
      else reserveSpot(button.dataset.eventId, button);
    });
  });
}

// Create a booking for the current user, then update the event's attendee count.
async function reserveSpot(eventId, button) {
  const user = getCurrentUser();
  if (!user) {
    location.href = "login.html";
    return;
  }

  const event = allEvents.find((item) => String(item.id) === String(eventId));
  if (!event) return;

  button.disabled = true;
  message.textContent = "";

  try {
    // Prevent duplicates.
    if (findMyBooking(eventId)) {
      message.textContent = "You have already reserved a spot for this event.";
      return;
    }

    const booking = await createItem("bookings", {
      userId: user.id,
      type: "event",
      targetId: event.id,
      targetName: event.title,
      date: event.date,
      time: event.time,
      note: "",
      status: "Confirmed",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    allBookings.push(booking);

    const updatedEvent = await updateItem("events", event.id, { attendees: Number(event.attendees || 0) + 1 });
    event.attendees = updatedEvent.attendees;

    message.textContent = "Your spot is reserved!";
    showEvents();
  } catch (error) {
    console.error(error);
    message.textContent = "Could not reserve your spot. Please refresh the page and try again.";
    button.disabled = false;
  }
}

// Delete the current user's booking and decrease the attendee count.
async function cancelReservation(eventId, button) {
  const user = getCurrentUser();
  if (!user) {
    location.href = "login.html";
    return;
  }

  const booking = findMyBooking(eventId);
  if (!booking) {
    message.textContent = "No reservation found for this event.";
    return;
  }

  if (!confirm("Cancel your reservation for this event?")) return;

  button.disabled = true;
  message.textContent = "";

  try {
    await deleteItem("bookings", booking.id);
    allBookings = allBookings.filter((b) => String(b.id) !== String(booking.id));

    const event = allEvents.find((item) => String(item.id) === String(eventId));
    if (event) {
      const updatedEvent = await updateItem("events", event.id, {
        attendees: Math.max(0, Number(event.attendees || 0) - 1),
      });
      event.attendees = updatedEvent.attendees;
    }

    message.textContent = "Your reservation was cancelled.";
    showEvents();
  } catch (error) {
    console.error(error);
    message.textContent = "Could not cancel your reservation. Please try again.";
    button.disabled = false;
  }
}

// Load events + bookings, then fill the filters and render.
async function loadEvents() {
  try {
    const [events, bookings] = await Promise.all([getAll("events"), getAll("bookings")]);
    allEvents = events
      .filter((event) => event.status === "Published")
      .sort((a, b) => a.date.localeCompare(b.date));
    allBookings = bookings;

    fillSelect(typeSelect, [...new Set(allEvents.map((event) => event.type))]);
    showEvents();
  } catch (error) {
    console.error(error);
    list.innerHTML = "<p>Could not load the demo events. Please refresh the page and try again.</p>";
  }
}

// Re-filter on any input change.
searchInput.addEventListener("input", showEvents);
typeSelect.addEventListener("change", showEvents);
dateSelect.addEventListener("change", showEvents);

loadEvents();