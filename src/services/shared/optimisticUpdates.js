/**
 * Shared utilities for optimistic updates with React Query
 *
 * These utilities standardize the optimistic update pattern used across mutations
 * to reduce code duplication and ensure consistent behavior.
 */

/**
 * Cancel multiple queries at once to prevent race conditions
 *
 * @param {QueryClient} queryClient - React Query client instance
 * @param {Array<{queryKey: Array}>} queries - Array of query configurations to cancel
 * @returns {Promise<void>}
 *
 * @example
 * await cancelQueries(queryClient, [
 *   { queryKey: ["posts"] },
 *   { queryKey: ["user-votes", userId] }
 * ]);
 */
export async function cancelQueries(queryClient, queries) {
  await Promise.all(
    queries.map((query) => queryClient.cancelQueries(query))
  );
}

/**
 * Snapshot multiple queries' data for rollback purposes
 *
 * @param {QueryClient} queryClient - React Query client instance
 * @param {Array<{queryKey: Array, useQueriesData?: boolean}>} queries - Queries to snapshot
 * @returns {Object} Map of query keys to their snapshot data
 *
 * @example
 * const snapshots = snapshotQueries(queryClient, [
 *   { queryKey: ["posts"], useQueriesData: true },  // All matching queries
 *   { queryKey: ["post", postId] }  // Single query
 * ]);
 */
export function snapshotQueries(queryClient, queries) {
  const snapshots = {};

  queries.forEach(({ queryKey, useQueriesData = false }) => {
    const key = JSON.stringify(queryKey);

    if (useQueriesData) {
      // Get all queries matching this key pattern (for infinite queries, etc.)
      snapshots[key] = queryClient.getQueriesData({ queryKey });
    } else {
      // Get single query
      snapshots[key] = queryClient.getQueryData(queryKey);
    }
  });

  return snapshots;
}

/**
 * Rollback queries to their previous snapshots
 *
 * @param {QueryClient} queryClient - React Query client instance
 * @param {Object} snapshots - Snapshot data from snapshotQueries
 *
 * @example
 * rollbackQueries(queryClient, context.snapshots);
 */
export function rollbackQueries(queryClient, snapshots) {
  Object.entries(snapshots).forEach(([key, data]) => {
    const queryKey = JSON.parse(key);

    // Check if this is from getQueriesData (array of [queryKey, data] pairs)
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      // Restore all matching queries
      data.forEach(([qKey, qData]) => {
        queryClient.setQueryData(qKey, qData);
      });
    } else {
      // Restore single query
      queryClient.setQueryData(queryKey, data);
    }
  });
}

/**
 * Update infinite query structure optimistically
 *
 * @param {QueryClient} queryClient - React Query client instance
 * @param {Object} options - Update options
 * @param {Array} options.queryKey - Query key to update
 * @param {Function} options.updater - Function to update each item (item => updatedItem)
 * @param {Function} options.predicate - Function to match items to update (item => boolean)
 *
 * @example
 * updateInfiniteQuery(queryClient, {
 *   queryKey: ["posts"],
 *   predicate: (post) => post.id === postId,
 *   updater: (post) => ({ ...post, score: post.score + 1 })
 * });
 */
export function updateInfiniteQuery(queryClient, { queryKey, updater, predicate }) {
  queryClient.setQueriesData({ queryKey }, (old) => {
    if (!old?.pages) return old;

    return {
      ...old,
      pages: old.pages.map((page) => {
        // Handle different page structures
        if (Array.isArray(page)) {
          // Page is an array of items
          return page.map((item) => predicate(item) ? updater(item) : item);
        } else if (page.posts) {
          // Page has a 'posts' array
          return {
            ...page,
            posts: page.posts.map((item) => predicate(item) ? updater(item) : item),
          };
        } else if (page.data) {
          // Page has a 'data' array
          return {
            ...page,
            data: page.data.map((item) => predicate(item) ? updater(item) : item),
          };
        }

        return page;
      }),
    };
  });
}

/**
 * Remove item from infinite query optimistically
 *
 * @param {QueryClient} queryClient - React Query client instance
 * @param {Object} options - Remove options
 * @param {Array} options.queryKey - Query key to update
 * @param {Function} options.predicate - Function to match items to remove (item => boolean)
 *
 * @example
 * removeFromInfiniteQuery(queryClient, {
 *   queryKey: ["posts"],
 *   predicate: (post) => post.id === deletedPostId
 * });
 */
export function removeFromInfiniteQuery(queryClient, { queryKey, predicate }) {
  queryClient.setQueriesData({ queryKey }, (old) => {
    if (!old?.pages) return old;

    return {
      ...old,
      pages: old.pages.map((page) => {
        // Handle different page structures
        if (Array.isArray(page)) {
          return page.filter((item) => !predicate(item));
        } else if (page.posts) {
          return {
            ...page,
            posts: page.posts.filter((item) => !predicate(item)),
          };
        } else if (page.data) {
          return {
            ...page,
            data: page.data.filter((item) => !predicate(item)),
          };
        }

        return page;
      }),
    };
  });
}

/**
 * Create standardized optimistic mutation handlers
 *
 * This is a factory function that creates onMutate, onError, and onSuccess handlers
 * with common optimistic update logic.
 *
 * @param {QueryClient} queryClient - React Query client instance
 * @param {Object} config - Configuration for optimistic updates
 * @param {Array} config.queriesToCancel - Queries to cancel before update
 * @param {Array} config.queriesToSnapshot - Queries to snapshot for rollback
 * @param {Function} config.onMutateUpdate - Custom logic to update cache (receives queryClient and variables)
 * @param {Array} [config.queriesToInvalidate] - Queries to invalidate on success
 * @param {Function} [config.onSuccessUpdate] - Custom logic after successful mutation
 * @returns {Object} Object with onMutate, onError, and onSuccess handlers
 *
 * @example
 * const handlers = createOptimisticMutationHandlers(queryClient, {
 *   queriesToCancel: [
 *     { queryKey: ["posts"] },
 *     { queryKey: ["user-votes", userId] }
 *   ],
 *   queriesToSnapshot: [
 *     { queryKey: ["posts"], useQueriesData: true },
 *     { queryKey: ["user-votes", userId] }
 *   ],
 *   onMutateUpdate: (queryClient, variables) => {
 *     // Custom optimistic update logic
 *     updateInfiniteQuery(queryClient, {
 *       queryKey: ["posts"],
 *       predicate: (post) => post.id === variables.postId,
 *       updater: (post) => ({ ...post, score: post.score + 1 })
 *     });
 *   },
 *   queriesToInvalidate: [
 *     { queryKey: ["user-votes", userId] }
 *   ]
 * });
 *
 * // Use in useMutation:
 * useMutation({
 *   mutationFn: ...,
 *   ...handlers
 * })
 */
export function createOptimisticMutationHandlers(queryClient, config) {
  const {
    queriesToCancel = [],
    queriesToSnapshot = [],
    onMutateUpdate,
    queriesToInvalidate = [],
    onSuccessUpdate,
  } = config;

  return {
    onMutate: async (variables) => {
      // Step 1: Cancel outgoing queries to prevent race conditions
      await cancelQueries(queryClient, queriesToCancel);

      // Step 2: Snapshot current data for rollback
      const snapshots = snapshotQueries(queryClient, queriesToSnapshot);

      // Step 3: Apply optimistic updates
      if (onMutateUpdate) {
        await onMutateUpdate(queryClient, variables);
      }

      // Step 4: Return context for error rollback
      return { snapshots };
    },

    onError: (err, variables, context) => {
      console.error("Mutation error, rolling back:", err);

      // Rollback all snapshots
      if (context?.snapshots) {
        rollbackQueries(queryClient, context.snapshots);
      }
    },

    onSuccess: (data, variables, context) => {
      // Custom success logic
      if (onSuccessUpdate) {
        onSuccessUpdate(data, variables, context, queryClient);
      }

      // Invalidate queries to sync with server
      queriesToInvalidate.forEach((query) => {
        queryClient.invalidateQueries(query);
      });
    },
  };
}

/**
 * Helper function to calculate vote score changes
 *
 * @param {string|null} currentVote - Current vote ("up", "down", or null)
 * @param {string|null} newVote - New vote ("up", "down", or null)
 * @returns {number} Net change in score
 *
 * @example
 * calculateScoreChange("up", "down") // returns -2 (remove +1, add -1)
 * calculateScoreChange(null, "up") // returns 1
 * calculateScoreChange("down", null) // returns 1 (remove -1)
 */
export function calculateScoreChange(currentVote, newVote) {
  let change = 0;

  // Remove old vote effect
  if (currentVote === "up") change -= 1;
  if (currentVote === "down") change += 1; // Removing a downvote increases score

  // Add new vote effect
  if (newVote === "up") change += 1;
  if (newVote === "down") change -= 1;

  return change;
}
