-- Diagnostic Script: Check Current Database State
-- Run this to see what's actually in your database

-- ============================================
-- CHECK 1: Is PostGIS enabled?
-- ============================================
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
    THEN '✅ PostGIS IS ENABLED'
    ELSE '❌ PostGIS NOT ENABLED - Run: CREATE EXTENSION postgis;'
  END as postgis_status;

-- Check PostGIS version
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
    THEN PostGIS_version()
    ELSE 'PostGIS not installed'
  END as postgis_version;

-- ============================================
-- CHECK 2: Posts table structure
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('status', 'location', 'latitude', 'longitude')
ORDER BY column_name;

-- ============================================
-- CHECK 3: Current posts data
-- ============================================
SELECT
  COUNT(*) as total_posts,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_status,
  COUNT(CASE WHEN location IS NULL THEN 1 END) as null_location,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as has_coordinates
FROM posts;

-- ============================================
-- CHECK 4: create_post function definition
-- ============================================
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%geography%'
    THEN '✅ Function uses geography type'
    ELSE '❌ Function does NOT use geography type'
  END as uses_geography
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'create_post';

-- ============================================
-- CHECK 5: Show actual function source
-- ============================================
SELECT pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'create_post';
