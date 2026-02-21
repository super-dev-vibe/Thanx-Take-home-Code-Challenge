CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR NOT NULL,
  points_balance INTEGER DEFAULT 0 NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR NOT NULL,
  points_cost INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  redeemed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS index_redemptions_on_user_id ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS index_redemptions_on_reward_id ON redemptions(reward_id);

INSERT OR IGNORE INTO users (id, name, points_balance, created_at, updated_at) VALUES (1, 'Demo User', 500, datetime('now'), datetime('now'));
INSERT OR IGNORE INTO rewards (id, name, points_cost, description, created_at, updated_at) VALUES (1, 'Free Coffee', 100, 'Any size coffee on us', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO rewards (id, name, points_cost, description, created_at, updated_at) VALUES (2, 'Free Pastry', 150, 'One pastry of your choice', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO rewards (id, name, points_cost, description, created_at, updated_at) VALUES (3, '$5 Off', 250, '$5 off your next order of $15+', datetime('now'), datetime('now'));
INSERT OR IGNORE INTO rewards (id, name, points_cost, description, created_at, updated_at) VALUES (4, 'Free Entrée', 400, 'Free entrée up to $12', datetime('now'), datetime('now'));
