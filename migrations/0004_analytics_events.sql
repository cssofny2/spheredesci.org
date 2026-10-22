-- Daily aggregate counts of named interactions (whitepaper, repository and lab link clicks).
-- No visitor identifiers, IP addresses or full URLs are stored.
CREATE TABLE IF NOT EXISTS analytics_events (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  target TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, target)
);

CREATE INDEX IF NOT EXISTS analytics_events_day ON analytics_events (day);
