-- Migration: Enable PostGIS extension
-- Date: 2025-12-28
-- Description: Enables PostGIS for spatial data support (geography/geometry types)
--
-- NOTE: This should ideally be the first migration, but we're adding it now
--       because earlier migrations assumed PostGIS was already enabled.
--       Using IF NOT EXISTS ensures this works even if already enabled manually.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Optional: Enable PostGIS topology extension (for advanced spatial operations)
-- CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS is available (optional check, can be commented out)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension failed to install';
  END IF;
END $$;
