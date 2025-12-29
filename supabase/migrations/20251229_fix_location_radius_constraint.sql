-- Fix location radius constraint
-- Date: 2025-12-29
-- Description: Updates location_radius constraint to support 300m (Classroom), 5000m (Campus), and -1 (Unlimited/Global)
--              Migrates existing 10000m users to 5000m (Campus)
--              Migrates existing 2000m users (if any) to 5000m (Campus)

BEGIN;

-- Step 1: Migrate existing users with 10000m to 5000m (Campus)
-- Rationale: 10000m is closest to Campus (5km) and prevents data loss
UPDATE users
SET location_radius = 5000
WHERE location_radius = 10000;

-- Step 2: Migrate any existing users with 2000m to 5000m (defensive)
UPDATE users
SET location_radius = 5000
WHERE location_radius = 2000;

-- Step 3: Drop the old constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_location_radius_check;

-- Step 4: Add new constraint allowing 300, 5000, and -1
ALTER TABLE users
ADD CONSTRAINT users_location_radius_check
CHECK (location_radius IN (300, 5000, -1));

-- Step 5: Ensure default is 5000 (Campus) for new users
ALTER TABLE users
ALTER COLUMN location_radius SET DEFAULT 5000;

COMMIT;
