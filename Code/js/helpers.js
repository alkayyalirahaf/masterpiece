// Shared small helpers: utilities, commission, and notifications.

// ---------- Utilities ----------

// Fill a <select> with <option> elements from an array of strings.
export function fillSelect(select, values) {
  select.innerHTML += values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

// Format a date string (YYYY-MM-DD) as "Mon, Oct 15, 2026".
export function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// Get initials from a full name: "Dr. Lena Morris" -> "LM".
export function initials(name) {
  return name.split(" ").filter(Boolean).slice(-2)
    .map((word) => word[0]).join("").toUpperCase();
}

// ---------- Commission ----------

export const COMMISSION_RATE = 0.10;

export function calcCommission(gross) {
  const amount = Number(gross) || 0;
  const commission = Number((amount * COMMISSION_RATE).toFixed(2));
  const net = Number((amount - commission).toFixed(2));
  return { gross: amount, commission, net };
}

// ---------- Notifications ----------

import { getWhere, createItem } from "./api.js";

export async function notifyGroupMembers(group, event) {
  const memberships = await getWhere("memberships", { groupId: group.id });
  const userIds = [...new Set(memberships.map((m) => String(m.userId)))]
    .filter((userId) => userId !== String(group.ownerId));

  for (const userId of userIds) {
    await createItem("notifications", {
      userId, type: "event", groupId: group.id, eventId: event.id,
      message: `New event in "${group.title}": ${event.title} on ${event.date}`,
      link: "events.html", read: false,
      createdAt: new Date().toISOString(),
    });
  }
  return userIds.length;
}

export async function countUnread(userId) {
  const mine = await getWhere("notifications", { userId });
  return mine.filter((n) => !n.read).length;
}