// Generic list page: handles groups, spaces, and specialists.
// Each page defines its config in a <script> tag (see HTML below).
import { getAll } from "./api.js";
import { mountLayout, renderGroupCard, renderSpaceCard, renderSpecialistCard } from "./ui.js";
import { fillSelect} from "./helpers.js";

mountLayout();



// ---------- Page configs ----------

const CONFIGS = {
  groups: {
    resource: "groups",
    card: renderGroupCard,
    searchFields: (g) => `${g.title} ${g.description} ${g.topic}`,
    filters: [
      { id: "topic-filter", field: "topic", label: "All topics" },
      { id: "city-filter",  field: "city",  label: "All cities" },
    ],
  },
  spaces: {
    resource: "spaces",
    card: renderSpaceCard,
    searchFields: (s) => `${s.title} ${s.type} ${s.city} ${s.description}`,
    filters: [
      { id: "type-filter",  field: "type",  label: "All types" },
      { id: "city-filter",  field: "city",  label: "All cities" },
      { id: "price-filter", field: "price", label: "All spaces",
        match: (item, value) =>
          value === "free" ? item.pricePerHour === 0 :
          value === "paid" ? item.pricePerHour > 0 : true,
        options: [
          { value: "",     label: "All spaces" },
          { value: "free", label: "Free spaces" },
          { value: "paid", label: "Paid spaces" },
        ],
      },
    ],
    clearButton: true,
  },
  specialists: {
    resource: "specialists",
    card: renderSpecialistCard,
    preFilter: (s) => s.status === "Verified",  // show only verified
    searchFields: (s) => `${s.name} ${s.role} ${s.specialty} ${s.topics}`,
    filters: [
      { id: "specialty-filter",    field: "specialty",    label: "All specialties" },
      { id: "availability-filter", field: "availability", label: "Any availability" },
    ],
  },
};

// ---------- Page logic ----------

const pageName = location.pathname.split("/").pop().replace(".html", "");
const config = CONFIGS[pageName];

let allItems = [];

function applyFilters() {
  const search = document.getElementById("search")?.value.trim().toLowerCase() || "";

  const result = allItems.filter((item) => {
    if (!config.searchFields(item).toLowerCase().includes(search)) return false;

    for (const f of config.filters) {
      const select = document.getElementById(f.id);
      if (!select) continue;
      const value = select.value;
      if (!value) continue;

      if (f.match) {
        if (!f.match(item, value)) return false;
      } else {
        if (String(item[f.field]) !== value) return false;
      }
    }
    return true;
  });

  const count = document.getElementById("results-count");
  const list = document.getElementById(`${pageName}-list`);

  if (count) count.textContent = `${result.length} ${result.length === 1 ? "result" : "results"}`;
  list.innerHTML = result.length
    ? result.map(config.card).join("")
    : "<p>No results match your search.</p>";
}

function initFilters() {
  for (const f of config.filters) {
    const select = document.getElementById(f.id);
    if (!select) continue;

    // If custom options are provided (like price), use them.
    if (f.options) {
      select.innerHTML = f.options
        .map((o) => `<option value="${o.value}">${o.label}</option>`)
        .join("");
    } else {
      // Otherwise, build from data (unique values).
      const values = [...new Set(allItems.map((item) => item[f.field]).filter(Boolean))];
      fillSelect(select, values);
    }

    select.addEventListener("change", applyFilters);
  }

  document.getElementById("search")?.addEventListener("input", applyFilters);

  // "Clear filters" button (spaces only).
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    document.getElementById("search").value = "";
    for (const f of config.filters) {
      const select = document.getElementById(f.id);
      if (select) select.value = "";
    }
    applyFilters();
  });
}

async function load() {
  try {
    let items = await getAll(config.resource);
    if (config.preFilter) items = items.filter(config.preFilter);
    allItems = items;

    initFilters();
    applyFilters();
  } catch (error) {
    console.error(error);
    const list = document.getElementById(`${pageName}-list`);
    if (list) list.innerHTML = "<p>Could not load the demo data. Please refresh the page and try again.</p>";
  }
}

if (config) load();