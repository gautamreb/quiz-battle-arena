CREATE TABLE IF NOT EXISTS rooms (
 code TEXT PRIMARY KEY,
 state TEXT NOT NULL,
 revision BIGINT NOT NULL DEFAULT 0,
 expires BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS rooms_expires_idx ON rooms (expires);
