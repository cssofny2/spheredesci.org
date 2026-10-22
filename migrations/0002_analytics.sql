-- Daily aggregates only; no visitor identifiers or raw IP addresses are stored.
CREATE TABLE IF NOT EXISTS analytics_page_views (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE TABLE IF NOT EXISTS analytics_searches (
  day TEXT NOT NULL,
  query TEXT NOT NULL,
  searches INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, query)
);

CREATE TABLE IF NOT EXISTS analytics_referrers (
  day TEXT NOT NULL,
  referrer TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, referrer)
);

CREATE INDEX IF NOT EXISTS analytics_page_views_day ON analytics_page_views (day);
CREATE INDEX IF NOT EXISTS analytics_searches_day ON analytics_searches (day);
CREATE INDEX IF NOT EXISTS analytics_referrers_day ON analytics_referrers (day);
