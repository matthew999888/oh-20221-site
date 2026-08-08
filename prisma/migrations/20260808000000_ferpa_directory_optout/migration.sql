-- FERPA directory-information opt-out (34 CFR § 99.37).
-- Cadets whose parent/eligible student has refused public disclosure of
-- directory information are excluded from the PUBLIC roster at /roster.
-- They remain fully visible inside the authenticated cadet portal.
ALTER TABLE "RosterEntry"
  ADD COLUMN "directoryOptOut" BOOLEAN NOT NULL DEFAULT false;

-- Supports the public roster query, which always filters on both columns.
CREATE INDEX "RosterEntry_active_directoryOptOut_idx"
  ON "RosterEntry" ("active", "directoryOptOut");
