


# Wanas (Support Circle) — Frontend Demo

## 🌱 Overview
**Wanas** is a welcoming platform designed for mental health support. It connects users with peer-led support groups, professional specialists, community spaces, and events. 

This project is a **Frontend-only demonstration** of the platform. It simulates a full-stack experience by using the browser's `localStorage` as a mock database and `sessionStorage` for authentication, requiring no backend server (like Node.js or PHP) to run.

---

## ✨ Key Features

- **Role-Based Access Control:** 5 distinct roles (Admin, Member, Facilitator, Specialist, Space Owner) with different dashboards and permissions.
- **Smart AI Assistant:** A rule-based recommendation engine that builds personalized support plans based on user input.
- **Group & Event Management:** Users can join groups, and Facilitators can create groups and host events in specific community spaces.
- **Booking System:** Users can book sessions with Specialists, reserve spots for Events, and book Community Spaces.
- **Venue & Commission Workflow:** Facilitators must select a venue for events. This creates a pending booking that the Space Owner must confirm. The platform simulates a 10% commission split.
- **Admin Dashboard:** A comprehensive dashboard for managing users, verifying specialists, resolving reports, and monitoring bookings.

---

## 🛠️ Tech Stack

- **HTML5 & CSS3:** Custom, responsive design. No external CSS frameworks used.
- **Vanilla JavaScript (ES Modules):** No frontend frameworks (like React or Vue).
- **LocalStorage:** Acts as the mock database (keys prefixed with `wanasDemo:`).
- **SessionStorage:** Manages user login sessions.

---

## 📂 Project Structure

```text
master/
├── index.html          # Main landing page (GitHub Pages entry point)
├── css/
│   └── style.css       # Global styles for the entire platform
├── js/
│   ├── api.js          # Mock API adapter (interacts with localStorage)
│   ├── auth.js         # Authentication, session management, and route guards
│   ├── seed-data.js    # Initial sample data (users, groups, events, etc.)
│   ├── components.js   # Shared UI elements (Header, Footer)
│   ├── admin.js        # Logic for Admin dashboard
│   ├── assistant.js    # AI Assistant logic
│   ├── events.js       # Event listing and booking logic
│   ├── home.js         # Home page rendering
│   ├── groups.js       # Group listing
│   ├── ... (other page-specific scripts)
├── html/               # All secondary pages
│   ├── login.html
│   ├── register.html
│   ├── admin.html
│   ├── groups.html
│   └── ...
├── docs/               # Project documentation
│   ├── wanas-schema.sql # The relational database schema (for future Backend)
│   ├── ERD.pdf          # Entity Relationship Diagram
│   └── SCHEMA.md        # Database documentation
└── master.pptx         # Project presentation




- **Figma Design:** [Wanas Figma Prototype](https://www.figma.com/make/Gq6N4mb7FJUrGDMxP5zNs0/Support?t=rxKgiYZ9rN7DgiaS-1)
- **Live Demo:** [Wanas Live Website](https://alkayyalirahaf.github.io/masterpiece/)