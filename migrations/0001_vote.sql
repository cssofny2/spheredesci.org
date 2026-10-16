-- Schema for the /vote/ API (already applied to the production database spheredesci-vote).
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS voters (h TEXT PRIMARY KEY, ip TEXT NOT NULL, created INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS voters_ip ON voters (ip, created);
CREATE TABLE IF NOT EXISTS ballots (project TEXT NOT NULL, item TEXT NOT NULL, voter TEXT NOT NULL, vote INTEGER NOT NULL CHECK (vote IN (-1, 1)), rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10), comment TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL, PRIMARY KEY (project, item, voter));
CREATE INDEX IF NOT EXISTS ballots_item ON ballots (project, item);
CREATE INDEX IF NOT EXISTS ballots_voter ON ballots (project, voter);
CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, project TEXT NOT NULL, voter TEXT NOT NULL, name TEXT NOT NULL, parent TEXT NOT NULL DEFAULT '', prompt TEXT NOT NULL DEFAULT '', svg TEXT NOT NULL, theme TEXT NOT NULL, layout TEXT NOT NULL, created INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS subs_project ON submissions (project, hidden, created);
CREATE INDEX IF NOT EXISTS subs_voter ON submissions (project, voter);
CREATE TABLE IF NOT EXISTS usage (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k));
