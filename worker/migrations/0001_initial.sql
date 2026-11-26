PRAGMA foreign_keys = ON;
CREATE TABLE classes (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, starts_at TEXT NOT NULL,
 capacity INTEGER NOT NULL CHECK(capacity BETWEEN 1 AND 500), password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE roster (
 class_id TEXT NOT NULL REFERENCES classes(id), code_hash TEXT NOT NULL,
 participant_id TEXT NOT NULL UNIQUE, enrolled_at TEXT,
 PRIMARY KEY(class_id, code_hash)
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, role TEXT NOT NULL, class_id TEXT REFERENCES classes(id),
 participant_id TEXT, expires INTEGER NOT NULL
);
CREATE TABLE runs (
 id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id), participant_id TEXT NOT NULL,
 experiment TEXT NOT NULL, protocol TEXT NOT NULL, metadata TEXT NOT NULL,
 started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), completed_at TEXT
);
CREATE TABLE trials (
 run_id TEXT NOT NULL REFERENCES runs(id), trial_index INTEGER NOT NULL,
 data TEXT NOT NULL, received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(run_id, trial_index)
);
CREATE INDEX runs_class ON runs(class_id, experiment);
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE rooms (
 id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id), p1 TEXT NOT NULL, p2 TEXT,
 created INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX one_waiting_player ON rooms(class_id, p1) WHERE active=1;
CREATE TABLE choices (
 room_id TEXT NOT NULL REFERENCES rooms(id), round INTEGER NOT NULL CHECK(round BETWEEN 1 AND 10),
 participant_id TEXT NOT NULL, choice TEXT NOT NULL CHECK(choice IN ('cooperate','defect')),
 rt REAL NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(room_id, round, participant_id)
);
