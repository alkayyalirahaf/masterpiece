// Static sample data for the frontend demo.
export const seedData = {
  users: [
    { id: 1, name: "Alex Morgan",     email: "alex@example.com",   password: "admin123", role: "admin",       createdAt: "2026-01-10", status: "Active"  },
    { id: 2, name: "Maya Anderson",   email: "maya@example.com",   password: "123456",   role: "member",      createdAt: "2026-09-18", status: "Active"  },
    { id: 3, name: "Sara Haddad",     email: "sara@example.com",   password: "123456",   role: "facilitator", createdAt: "2026-09-12", status: "Active"  },
    { id: 4, name: "Dr. Lena Morris", email: "lena@example.com",   password: "123456",   role: "specialist",  createdAt: "2026-09-10", status: "Active"  },
    { id: 5, name: "Rana Haddad",     email: "rana@example.com",   password: "123456",   role: "owner",       createdAt: "2026-09-10", status: "Active"  },
    { id: 6, name: "Priya Shah",      email: "priya@example.com",  password: "123456",   role: "specialist",  createdAt: "2026-09-15", status: "Pending" },
  ],

  groups: [
    { id: 1, title: "Living with anxiety",  topic: "Anxiety",        members: 1248, description: "A gentle peer-led space for sharing everyday coping tools.", facilitator: "Sara Haddad", lastActivity: "8 min ago",  status: "Healthy", city: "Amman",  ownerId: 3 },
    { id: 2, title: "Grief and healing",    topic: "Grief",          members: 935,  description: "A moderated space to remember, process, and move forward together.", facilitator: "Sara Haddad", lastActivity: "1 hr ago",   status: "Healthy", city: "Irbid",  ownerId: 3 },
    { id: 3, title: "Caregiver connection", topic: "Caregiving",     members: 628,  description: "Practical and emotional support for people caring for loved ones.", facilitator: "Sara Haddad", lastActivity: "2 hrs ago",  status: "Healthy", city: "Zarqa",  ownerId: 3 },
    { id: 4, title: "Burnout recovery",     topic: "Stress & burnout", members: 702, description: "Practical ways to rest, set limits, and rebuild energy after exhaustion.", facilitator: "Sara Haddad", lastActivity: "3 hrs ago", status: "Healthy", city: "Amman", ownerId: 3 },
  ],

  events: [
    { id: 1, title: "Grounding techniques for anxious days", type: "Workshop",         date: "2026-10-15", time: "6:00 PM – 7:00 PM",  host: "Dr. Lena Morris", attendees: 284, status: "Published", groupId: 1, spaceId: 1, venueName: "The Commons Hub",     venueAddress: "Abdali Boulevard, Building 12, Amman" },
    { id: 2, title: "Open community check-in",                type: "Peer gathering",   date: "2026-10-19", time: "12:00 PM – 1:00 PM", host: "Maya Anderson",   attendees: 126, status: "Published", spaceId: 2, venueName: "Quiet Corner",       venueAddress: "Jabal Amman, 3rd Circle, Amman" },
    { id: 3, title: "Caregiver coffee hour",                  type: "Small group",      date: "2026-10-22", time: "10:00 AM – 11:00 AM", host: "Priya Shah",     attendees: 58,  status: "Published", groupId: 3, spaceId: 3, venueName: "Small Wins Studio",  venueAddress: "University Street, Floor 2, Irbid" },
    { id: 4, title: "Making space for grief",                 type: "Specialist talk",  date: "2026-10-29", time: "5:30 PM – 6:30 PM",  host: "Sara Haddad",    attendees: 196, status: "Published", groupId: 2, spaceId: 1, venueName: "The Commons Hub",     venueAddress: "Abdali Boulevard, Building 12, Amman" },
  ],

  specialists: [
    { id: 1, name: "Dr. Lena Morris", role: "Licensed therapist",     topics: "Anxiety, stress, life transitions", specialty: "Anxiety & stress", sessions: 84, availability: "This week", status: "Verified", userId: 4, price: 25 },
    { id: 2, name: "Marcus Chen",     role: "Certified grief counselor", topics: "Grief, loss, family support",     specialty: "Grief & loss",     sessions: 62, availability: "Today",     status: "Verified", userId: 6, price: 30 },
    { id: 3, name: "Elena Brooks",    role: "Licensed social worker", topics: "Relationships, identity, burnout", specialty: "Relationships",    sessions: 71, availability: "Next week", status: "Verified", userId: 6, price: 25 },
    { id: 4, name: "Priya Shah",      role: "Peer support specialist", topics: "Caregiving, chronic illness",     specialty: "Caregiving",       sessions: 48, availability: "This week", status: "Pending",  userId: 6, price: 35 },
  ],

  spaces: [
    { id: 1, title: "The Commons Hub",  type: "Open conversation",    description: "A welcoming room for everyday check-ins, questions, and encouragement.", city: "Amman", address: "Abdali Boulevard, Building 12", capacity: 30, pricePerHour: 0, openHours: "9:00 AM – 9:00 PM", amenities: ["Wi-Fi", "Tea & coffee", "Accessible entrance"], ownerId: 5 },
    { id: 2, title: "Quiet Corner",     type: "Low-pressure space",  description: "A calm, small room to read, reflect, or sit quietly with others.",       city: "Amman", address: "Jabal Amman, 3rd Circle",       capacity: 10, pricePerHour: 5, openHours: "10:00 AM – 8:00 PM", amenities: ["Wi-Fi", "Soft lighting", "Private entrance"],  ownerId: 5 },
    { id: 3, title: "Small Wins Studio", type: "Positive reflection", description: "A bright studio for workshops, group sessions, and celebrating progress.", city: "Irbid", address: "University Street, Floor 2",     capacity: 20, pricePerHour: 8, openHours: "9:00 AM – 7:00 PM",  amenities: ["Projector", "Wi-Fi", "Whiteboard"],            ownerId: 5 },
  ],

  reports: [
    { id: 1, code: "#SC-2048", category: "Community conduct", submitted: "8 min ago",  assignedTo: "Alex Morgan",  status: "Open" },
    { id: 2, code: "#SC-2047", category: "Misinformation",   submitted: "42 min ago", assignedTo: "Maya Anderson", status: "Investigating" },
    { id: 3, code: "#SC-2046", category: "Spam",             submitted: "2 hrs ago",  assignedTo: "Sara Haddad",   status: "Resolved" },
  ],

  bookings: [
    { id: 1, userId: 2, type: "specialist", targetId: 1, targetName: "Dr. Lena Morris", date: "2026-10-14", time: "4:00 PM", note: "First session about anxiety.", status: "Pending",   createdAt: "2026-10-06" },
    { id: 2, userId: 2, type: "space",      targetId: 2, targetName: "Quiet Corner",    date: "2026-10-16", time: "6:00 PM", note: "Small peer meetup, 6 people.", status: "Confirmed", createdAt: "2026-10-05" },
  ],

  memberships: [
    { id: 1, userId: 2, groupId: 1 },
    { id: 2, userId: 2, groupId: 2 },
  ],

  notifications: [
    { id: 1, userId: 2, type: "event", groupId: 1, eventId: 1, message: `New event in "Living with anxiety": Grounding techniques for anxious days on 2026-10-15`, link: "events.html", read: false, createdAt: "2026-10-08T09:00:00.000Z" },
    { id: 2, userId: 2, type: "event", groupId: 2, eventId: 4, message: `New event in "Grief and healing": Making space for grief on 2026-10-29`,                 link: "events.html", read: false, createdAt: "2026-10-08T10:30:00.000Z" },
  ],
};