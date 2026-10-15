CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member', 'facilitator', 'specialist', 'owner') NOT NULL,
  status ENUM('Pending', 'Active', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
);




CREATE TABLE `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ownerId INT NULL,
  title VARCHAR(150) NOT NULL,
  topic VARCHAR(50) NOT NULL,
  description TEXT,
  city VARCHAR(50) NOT NULL,
  members INT NOT NULL DEFAULT 0,               -- counter (also = COUNT of memberships)
  lastActivityAt TIMESTAMP NULL DEFAULT NULL,   -- a real date, not the text "8 min ago"
  status ENUM('Healthy', 'Review', 'Archived') NOT NULL DEFAULT 'Healthy',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (ownerId) REFERENCES users(id),
  INDEX idx_groups_topic (topic),
  INDEX idx_groups_city (city),
  INDEX idx_groups_owner (ownerId)
);


CREATE TABLE specialists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  role VARCHAR(100) NOT NULL,                   -- job title, e.g. "Licensed therapist"
  topics VARCHAR(255),
  specialty ENUM('Anxiety & stress', 'Grief & loss', 'Caregiving', 'Relationships', 'Life transitions', 'Chronic illness') NOT NULL,
  sessions INT NOT NULL DEFAULT 0,
  availability ENUM('Today', 'This week', 'Next week', 'Not set') NOT NULL DEFAULT 'Not set',
  status ENUM('Pending', 'Verified') NOT NULL DEFAULT 'Pending',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX idx_specialists_specialty (specialty),
  INDEX idx_specialists_status (status)
);



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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (ownerId) REFERENCES users(id),
  INDEX idx_spaces_city (city),
  INDEX idx_spaces_owner (ownerId)
);


CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT NULL,
  spaceId INT NULL,
  hostId INT NULL,
  title VARCHAR(200) NOT NULL,
  type ENUM('Peer gathering', 'Small group', 'Specialist talk', 'Workshop') NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  attendees INT NOT NULL DEFAULT 0,             -- counter (also = COUNT of event bookings)
  status ENUM('Draft', 'Published', 'Cancelled') NOT NULL DEFAULT 'Draft',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (groupId) REFERENCES `groups`(id),
  FOREIGN KEY (spaceId) REFERENCES spaces(id),
  FOREIGN KEY (hostId) REFERENCES users(id),
  INDEX idx_events_date (date),
  INDEX idx_events_status (status),
  INDEX idx_events_group (groupId)
);


CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  groupId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (groupId) REFERENCES `groups`(id),
  UNIQUE KEY unique_membership (userId, groupId)
);


CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('specialist', 'space', 'event') NOT NULL,
  specialistId INT NULL,
  spaceId INT NULL,
  eventId INT NULL,
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  duration INT,
  people INT,
  note TEXT,
  status ENUM('Pending', 'Confirmed', 'Declined', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
  amount DECIMAL(10,2),
  commissionRate DECIMAL(4,3) DEFAULT 0.100,
  platformCommission DECIMAL(10,2),
  providerAmount DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (specialistId) REFERENCES specialists(id),
  FOREIGN KEY (spaceId) REFERENCES spaces(id),
  FOREIGN KEY (eventId) REFERENCES events(id),
  INDEX idx_bookings_user (userId),
  INDEX idx_bookings_date (date),
  INDEX idx_bookings_status (status)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  groupId INT NULL,
  eventId INT NULL,
  type VARCHAR(50),
  message TEXT NOT NULL,
  link VARCHAR(100),
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (groupId) REFERENCES `groups`(id),
  FOREIGN KEY (eventId) REFERENCES events(id),
  INDEX idx_notifications_user_read (userId, isRead)
);


CREATE TABLE facilitatorApplications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  reviewedBy INT NULL,
  proposedTopic VARCHAR(200) NOT NULL,
  reason TEXT NOT NULL,
  experience TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  reviewedAt TIMESTAMP NULL DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id),
  INDEX idx_fa_user (userId),
  INDEX idx_fa_status (status)
);


CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporterId INT NULL,
  assignedToId INT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  category ENUM('Community conduct', 'Misinformation', 'Spam', 'Privacy concern', 'Harassment', 'Other') NOT NULL,
  description TEXT,
  status ENUM('Open', 'Investigating', 'Resolved', 'Dismissed') NOT NULL DEFAULT 'Open',
  resolvedAt TIMESTAMP NULL DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (reporterId) REFERENCES users(id),
  FOREIGN KEY (assignedToId) REFERENCES users(id),
  INDEX idx_reports_status (status)
);



