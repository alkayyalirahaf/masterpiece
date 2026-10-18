-- Support Circle / Wanas MVP schema (MySQL 8.0.16+ for CHECK constraints).
-- API contract notes:
--   * groups.members, specialists.sessions, and events.attendees are derived counts, not stored columns.
--   * Map bookings target IDs to the front-end targetId/targetName fields in API responses.
--   * Map notifications.isRead to the front-end read field.
--   * Map facilitatorApplications.submittedAt to the front-end submittedAt field.
--   * Render host names and target names by joining their related users/resources.

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member', 'facilitator', 'specialist', 'owner') NOT NULL,
  status ENUM('Pending', 'Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerId INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  topic VARCHAR(50) NOT NULL,
  description TEXT,
  city VARCHAR(50) NOT NULL,
  lastActivityAt TIMESTAMP NULL DEFAULT NULL,
  status ENUM('Healthy', 'Review', 'Archived') NOT NULL DEFAULT 'Healthy',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_groups_owner FOREIGN KEY (ownerId) REFERENCES users(id),
  INDEX idx_groups_topic (topic),
  INDEX idx_groups_city (city),
  INDEX idx_groups_owner (ownerId)
) ENGINE=InnoDB;

CREATE TABLE specialists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL,
  topics VARCHAR(255),
  specialty ENUM('Anxiety & stress', 'Grief & loss', 'Caregiving', 'Relationships', 'Life transitions', 'Chronic illness') NOT NULL,
  availability ENUM('Today', 'This week', 'Next week', 'Not set') NOT NULL DEFAULT 'Not set',
  status ENUM('Pending', 'Review', 'Verified') NOT NULL DEFAULT 'Pending',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_specialists_user FOREIGN KEY (userId) REFERENCES users(id),
  CONSTRAINT chk_specialist_price CHECK (price >= 0),
  INDEX idx_specialists_specialty (specialty),
  INDEX idx_specialists_status (status)
) ENGINE=InnoDB;

CREATE TABLE spaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerId INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  type ENUM('Open conversation', 'Low-pressure space', 'Positive reflection', 'Outdoor-friendly space', 'Workshop space') NOT NULL,
  description TEXT,
  city VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  pricePerHour DECIMAL(10,2) NOT NULL DEFAULT 0,
  openHours VARCHAR(100),
  amenities JSON,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_spaces_owner FOREIGN KEY (ownerId) REFERENCES users(id),
  CONSTRAINT chk_space_capacity CHECK (capacity > 0),
  CONSTRAINT chk_space_price CHECK (pricePerHour >= 0),
  INDEX idx_spaces_city (city),
  INDEX idx_spaces_owner (ownerId)
) ENGINE=InnoDB;

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT NULL,
  spaceId INT NULL,
  hostId INT NULL,
  title VARCHAR(200) NOT NULL,
  type ENUM('Peer gathering', 'Small group', 'Specialist talk', 'Workshop') NOT NULL,
  startsAt DATETIME NOT NULL,
  endsAt DATETIME NOT NULL,
  timeZone VARCHAR(64) NOT NULL DEFAULT 'Asia/Amman',
  status ENUM('Draft', 'Pending venue confirmation', 'Draft - venue declined', 'Published', 'Cancelled') NOT NULL DEFAULT 'Draft',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_events_group FOREIGN KEY (groupId) REFERENCES `groups`(id),
  CONSTRAINT fk_events_space FOREIGN KEY (spaceId) REFERENCES spaces(id),
  CONSTRAINT fk_events_host FOREIGN KEY (hostId) REFERENCES users(id),
  CONSTRAINT chk_event_time CHECK (endsAt > startsAt),
  INDEX idx_events_starts_status (startsAt, status),
  INDEX idx_events_group (groupId),
  INDEX idx_events_space_time (spaceId, startsAt, endsAt)
) ENGINE=InnoDB;

CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  groupId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_memberships_user FOREIGN KEY (userId) REFERENCES users(id),
  CONSTRAINT fk_memberships_group FOREIGN KEY (groupId) REFERENCES `groups`(id),
  CONSTRAINT unique_membership UNIQUE (userId, groupId),
  INDEX idx_memberships_group (groupId)
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('specialist', 'space', 'event') NOT NULL,
  specialistId INT NULL,
  spaceId INT NULL,
  eventId INT NULL,
  startsAt DATETIME NOT NULL,
  endsAt DATETIME NOT NULL,
  timeZone VARCHAR(64) NOT NULL DEFAULT 'Asia/Amman',
  duration INT NULL,
  people INT NULL,
  note TEXT,
  status ENUM('Pending', 'Confirmed', 'Declined', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  commissionRate DECIMAL(4,3) NOT NULL DEFAULT 0.100,
  platformCommission DECIMAL(10,2) NOT NULL DEFAULT 0,
  providerAmount DECIMAL(10,2) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_bookings_user FOREIGN KEY (userId) REFERENCES users(id),
  CONSTRAINT fk_bookings_specialist FOREIGN KEY (specialistId) REFERENCES specialists(id),
  CONSTRAINT fk_bookings_space FOREIGN KEY (spaceId) REFERENCES spaces(id),
  CONSTRAINT fk_bookings_event FOREIGN KEY (eventId) REFERENCES events(id),
  CONSTRAINT chk_booking_target CHECK (
    (type = 'specialist' AND specialistId IS NOT NULL AND spaceId IS NULL AND eventId IS NULL)
    OR (type = 'space' AND specialistId IS NULL AND spaceId IS NOT NULL)
    OR (type = 'event' AND specialistId IS NULL AND spaceId IS NULL AND eventId IS NOT NULL)
  ),
  CONSTRAINT unique_event_reservation UNIQUE (userId, type, eventId),
  CONSTRAINT chk_booking_time CHECK (endsAt > startsAt),
  CONSTRAINT chk_booking_duration CHECK (duration IS NULL OR duration > 0),
  CONSTRAINT chk_booking_people CHECK (people IS NULL OR people > 0),
  CONSTRAINT chk_booking_amounts CHECK (amount >= 0 AND commissionRate >= 0 AND commissionRate <= 1 AND platformCommission >= 0 AND providerAmount >= 0),
  INDEX idx_bookings_user (userId),
  INDEX idx_bookings_specialist_time (specialistId, startsAt, endsAt),
  INDEX idx_bookings_space_time (spaceId, startsAt, endsAt),
  INDEX idx_bookings_event_user (eventId, userId, type),
  INDEX idx_bookings_status (status)
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  groupId INT NULL,
  eventId INT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(100),
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id),
  CONSTRAINT fk_notifications_group FOREIGN KEY (groupId) REFERENCES `groups`(id),
  CONSTRAINT fk_notifications_event FOREIGN KEY (eventId) REFERENCES events(id),
  INDEX idx_notifications_user_read (userId, isRead, createdAt)
) ENGINE=InnoDB;

CREATE TABLE facilitatorApplications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  reviewedBy INT NULL,
  proposedTopic VARCHAR(200) NOT NULL,
  reason TEXT NOT NULL,
  experience TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  submittedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewedAt TIMESTAMP NULL DEFAULT NULL,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_facilitator_app_user FOREIGN KEY (userId) REFERENCES users(id),
  CONSTRAINT fk_facilitator_app_reviewer FOREIGN KEY (reviewedBy) REFERENCES users(id),
  INDEX idx_fa_user (userId),
  INDEX idx_fa_status (status)
) ENGINE=InnoDB;

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporterId INT NULL,
  assignedToId INT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  category ENUM('Community conduct', 'Misinformation', 'Spam', 'Privacy concern', 'Harassment', 'Other') NOT NULL,
  description TEXT,
  status ENUM('Open', 'Investigating', 'Resolved', 'Dismissed') NOT NULL DEFAULT 'Open',
  resolvedAt TIMESTAMP NULL DEFAULT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporterId) REFERENCES users(id),
  CONSTRAINT fk_reports_assignee FOREIGN KEY (assignedToId) REFERENCES users(id),
  INDEX idx_reports_status (status)
) ENGINE=InnoDB;

