// Frontend-only data layer: sample data is copied into this browser's localStorage.
// This is a demo adapter, not a backend or a secure database.
import { seedData } from "./seed-data.js";

// All demo keys share this prefix so they can be cleared safely.
const PREFIX = "wanasDemo:";

// Read a resource from localStorage. If missing, copy the sample data first.
function read(resource) {
  const stored = localStorage.getItem(PREFIX + resource);
  if (stored !== null) {
    try {
      return JSON.parse(stored);
    } catch {
      // Corrupted value: fall through and restore sample data.
    }
  }
  const initial = structuredClone(seedData[resource] || []);
  localStorage.setItem(PREFIX + resource, JSON.stringify(initial));
  return initial;
}

// Write a resource back to localStorage.
function write(resource, items) {
  localStorage.setItem(PREFIX + resource, JSON.stringify(items));
}

// Generate the next numeric id for a resource.
function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

// Return all rows of a resource (deep-cloned so callers cannot mutate storage).
export async function getAll(resource) {
  return structuredClone(read(resource));
}

// Return one row by id, or null if not found.
export async function getOne(resource, id) {
  const item = read(resource).find((row) => String(row.id) === String(id));
  return item ? structuredClone(item) : null;
}

// Return all rows that match every condition (strict equality on string values).
export async function getWhere(resource, conditions) {
  return read(resource)
    .filter((item) =>
      Object.entries(conditions).every(
        ([field, value]) => String(item[field]) === String(value)
      )
    )
    .map((item) => structuredClone(item));
}

// Create a new row with an auto-generated id.
export async function createItem(resource, data) {
  const items = read(resource);
  const item = { id: nextId(items), ...structuredClone(data) };
  items.push(item);
  write(resource, items);
  return structuredClone(item);
}

// Update an existing row by id. Throws if the row does not exist.
export async function updateItem(resource, id, changes) {
  const items = read(resource);
  const index = items.findIndex((row) => String(row.id) === String(id));
  if (index < 0) throw new Error(`${resource} item not found`);
  items[index] = { ...items[index], ...structuredClone(changes), id: items[index].id };
  write(resource, items);
  return structuredClone(items[index]);
}

// Delete a row by id. Returns true if something was removed.
export async function deleteItem(resource, id) {
  const items = read(resource);
  const next = items.filter((row) => String(row.id) !== String(id));
  if (next.length === items.length) return false;
  write(resource, next);
  return true;
}

// Clear every demo key so the next read restores the original sample data.
export function resetDemoData() {
  Object.keys(seedData).forEach((resource) => localStorage.removeItem(PREFIX + resource));
}