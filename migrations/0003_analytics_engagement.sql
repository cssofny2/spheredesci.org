CREATE TABLE IF NOT EXISTS analytics_engagement (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  total_scroll INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE INDEX IF NOT EXISTS analytics_engagement_day ON analytics_engagement (day);
