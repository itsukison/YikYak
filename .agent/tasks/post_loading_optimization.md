Post Loading & Feed Architecture Optimization Plan
1. Problem Statement
The home feed is experiencing critical UX and scalability issues:

Blocking on GPS: Users see "Loading..." indefinitely if location services are slow/unavailable
Database Overload: Every feed refresh hits PostgreSQL with expensive geospatial queries
Global Realtime Storm: All clients refetch on every post insert globally, creating exponential load
Inefficient Queries: N+1 pattern fetching posts then photos separately

Business Impact: Users abandoning app during load, database costs scaling linearly with users, poor retention.
2. Current Architecture

Frontend: React Native + Expo, @tanstack/react-query
Backend: Supabase PostgreSQL
Feed Flow: home.jsx → waits for GPS → usePostsQuery → get_posts_within_radius RPC → separate photo fetch
Realtime: Global subscription to posts table INSERT events

3. Production-Ready Solution
Core Principles

Instant Load: Show cached content immediately, update in background
Graceful Degradation: Feed works without GPS, with stale location, or offline
Smart Filtering: Only listen to relevant geographic updates
Single Query: Fetch complete posts (with photos) in one round-trip


4. Implementation Plan
Phase 1: Critical UX Fixes (Ship This Week)
1.1 Location Strategy
Problem: GPS blocking entire feed load
Solution: Cached-first with background refresh
javascript// In home.jsx
const [feedLocation, setFeedLocation] = useState(null);

useEffect(() => {
  // Load cached location synchronously
  const cached = await AsyncStorage.getItem('lastKnownLocation');
  if (cached) {
    setFeedLocation(JSON.parse(cached));
  }
  
  // Get fresh location in background (with 5s timeout)
  const timeoutId = setTimeout(() => {
    // If GPS takes >5s, stick with cached
  }, 5000);
  
  const fresh = await getLocationPermission();
  clearTimeout(timeoutId);
  
  if (fresh) {
    setFeedLocation(fresh);
    await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(fresh));
  }
}, []);

// Feed loads immediately with cached location
const { data: posts } = usePostsQuery(feedLocation); // Remove enabled: !!location
UI Indicators:

Show feed instantly with cached data
Subtle badge: "Refreshing location..." while GPS resolves
No full-page loading states

Acceptance Criteria:

Feed visible within 300ms of app launch
Works offline with last known location
Smooth transition when GPS updates (no flash)


1.2 Optimize Database Query
Problem: N+1 query pattern
Solution: Single RPC returning complete posts
sql-- New RPC: get_feed_optimized
CREATE OR REPLACE FUNCTION get_feed_optimized(
  user_lat FLOAT,
  user_lon FLOAT,
  radius_km FLOAT DEFAULT 5.0,
  page_size INT DEFAULT 20
)
RETURNS TABLE (
  post_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ,
  photo_urls TEXT[], -- Array of photo URLs
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    u.username,
    u.avatar_url,
    p.caption,
    p.created_at,
    ARRAY_AGG(ph.url ORDER BY ph.order) as photo_urls,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography
    ) / 1000 as distance_km
  FROM posts p
  INNER JOIN users u ON p.user_id = u.id
  LEFT JOIN post_photos ph ON p.id = ph.post_id
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
    radius_km * 1000
  )
  GROUP BY p.id, u.username, u.avatar_url
  ORDER BY p.created_at DESC
  LIMIT page_size;
END;
$$ LANGUAGE plpgsql;

-- Add index if not exists
CREATE INDEX IF NOT EXISTS posts_location_gist 
ON posts USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography);
Frontend Update:
javascript// usePostsQuery.js - simplified
export function usePostsQuery(location) {
  return useQuery({
    queryKey: ['feed', location?.latitude, location?.longitude],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_feed_optimized', {
        user_lat: location.latitude,
        user_lon: location.longitude,
        radius_km: 5.0
      });
      
      if (error) throw error;
      return data; // Already includes photos
    },
    staleTime: 60000, // 1 minute
    enabled: !!location // Now safe since we always have cached location
  });
}
Performance Gain: Reduces feed load from 2 queries → 1 query, saves 100-300ms per load.

1.3 Geospatially-Scoped Realtime
Problem: Global INSERT subscription hitting all clients
Solution: Filter by geohash cells
sql-- Add geohash column to posts
ALTER TABLE posts ADD COLUMN geohash_6 TEXT;

-- Trigger to populate automatically
CREATE OR REPLACE FUNCTION update_post_geohash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geohash_6 = ST_GeoHash(
    ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geometry,
    6  -- ~1.2km precision
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_set_geohash
BEFORE INSERT OR UPDATE OF latitude, longitude ON posts
FOR EACH ROW EXECUTE FUNCTION update_post_geohash();

-- Backfill existing posts
UPDATE posts SET geohash_6 = ST_GeoHash(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geometry, 6
);

CREATE INDEX posts_geohash_6_idx ON posts(geohash_6);
Frontend Subscription:
javascript// In home.jsx
import ngeohash from 'ngeohash'; // npm install ngeohash

const subscribeToNewPosts = (location) => {
  if (!location) return;
  
  // Get user's geohash + 8 neighbors (covers ~10km radius)
  const userHash = ngeohash.encode(location.latitude, location.longitude, 6);
  const neighbors = ngeohash.neighbors(userHash);
  const relevantHashes = [userHash, ...Object.values(neighbors)];
  
  const channel = supabase
    .channel('nearby-posts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `geohash_6=in.(${relevantHashes.join(',')})`
      },
      (payload) => {
        // Only refetch if post is actually within radius
        const distance = calculateDistance(location, payload.new);
        if (distance <= 5000) { // 5km in meters
          queryClient.invalidateQueries(['feed']);
        }
      }
    )
    .subscribe();
    
  return () => supabase.removeChannel(channel);
};
Scalability: Reduces realtime traffic by ~100-1000x depending on user distribution.

Phase 2: Production Hardening (Next 2 Weeks)
2.1 Error States & Edge Cases
javascript// In home.jsx
const { data: posts, isLoading, error } = usePostsQuery(feedLocation);

if (error?.message?.includes('location_required')) {
  return <LocationPermissionPrompt />;
}

if (!isLoading && posts?.length === 0) {
  return (
    <EmptyState
      title="No posts nearby"
      subtitle="Be the first to post in your area!"
      action={<Button>Create Post</Button>}
    />
  );
}

// Show offline banner if network unavailable
if (error?.message?.includes('network')) {
  return <OfflineBanner>Showing cached posts</OfflineBanner>;
}
2.2 Pagination with Cursors
javascript// Infinite scroll support
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed', location],
  queryFn: ({ pageParam = null }) => 
    supabase.rpc('get_feed_optimized', {
      user_lat: location.latitude,
      user_lon: location.longitude,
      cursor_after: pageParam // Last post ID from previous page
    }),
  getNextPageParam: (lastPage) => lastPage.at(-1)?.post_id
});
2.3 Observability
javascript// Add monitoring hooks
useEffect(() => {
  if (posts) {
    analytics.track('feed_loaded', {
      post_count: posts.length,
      load_time_ms: performance.now() - startTime,
      used_cached_location: !location // Track fallback usage
    });
  }
}, [posts]);

Phase 3: Scale with Caching (When Needed)
Trigger: When database CPU consistently >70% or query latency >500ms
3.1 Redis Cache Layer
typescript// supabase/functions/feed-proxy/index.ts
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

Deno.serve(async (req) => {
  const { latitude, longitude } = await req.json();
  
  // Generate cache key from geohash
  const geohash = encodeGeohash(latitude, longitude, 6);
  const cacheKey = `feed:${geohash}:v1`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'X-Cache': 'HIT' }
    });
  }
  
  // Cache miss - fetch from DB
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_KEY')
  );
  
  const { data } = await supabase.rpc('get_feed_optimized', {
    user_lat: latitude,
    user_lon: longitude
  });
  
  // Cache for 60 seconds
  await redis.setex(cacheKey, 60, JSON.stringify(data));
  
  return new Response(JSON.stringify(data), {
    headers: { 'X-Cache': 'MISS' }
  });
});
Cache Invalidation: Time-based only (60s TTL). No complex invalidation logic needed.
Expected Performance:

Cache hit rate: 85-95%
Response time: <50ms (cached) vs ~200-500ms (DB)
DB load reduction: 90%+


5. Rollout Strategy
Week 1: Foundation

 Deploy cached location logic
 Add geohash column + trigger
 Create optimized RPC
 Update frontend to use new RPC
 Test with 10% of users

Week 2: Realtime Fix

 Deploy geohash-filtered subscriptions
 Monitor realtime message volume
 Rollout to 50% of users

Week 3: Polish

 Add error states + empty states
 Implement pagination
 Add analytics tracking
 100% rollout

Week 4+: Scale (Only If Needed)

 Set up Redis (Upstash)
 Deploy Edge Function
 A/B test cached vs direct DB
 Monitor cache hit rate


6. Success Metrics
Before (Current State):

Feed load time: 3-10s (GPS dependent)
DB queries per feed load: 2+
Realtime messages per minute: 10 posts × 1000 users = 10,000 events

After (Phase 1):

Feed load time: <500ms (cached location)
DB queries per feed load: 1
Realtime messages per minute: 10 posts × ~10 nearby users per post = 100 events

Target (Phase 3 with Redis):

Feed load time: <100ms (90% cache hit rate)
DB queries per feed load: 0.1 (cached)
Database CPU: <40%


7. Risks & Mitigations
RiskMitigationStale cached location shows irrelevant postsBackground GPS refresh + 5km radius provides toleranceGeohash filter misses posts near cell boundariesSubscribe to 8 neighboring cells (covers ~10km)Edge Function cold starts add latencyKeep functions warm with scheduled pings, or skip Edge Functions initiallyUsers in low-density areas see empty feedsGradually expand radius (5km → 10km → 25km) until posts found

8. What We're NOT Doing (And Why)
❌ Real-time cache invalidation: Too complex, 60s TTL is sufficient for social feed
❌ Multiple Redis regions: Premature, single Redis handles 10K+ RPS
❌ GraphQL/complex data layer: Supabase RPC is sufficient
❌ ML-powered feed ranking: Not needed until Phase 1 performance is solved