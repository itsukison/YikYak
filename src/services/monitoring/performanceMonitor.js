/**
 * Performance Monitoring Utilities
 * Tracks query performance, cache hit rates, and errors for production monitoring
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queryTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: [],
      mutationTimes: [],
    };
    this.maxMetricsSize = 100; // Keep last 100 metrics
  }

  /**
   * Track query execution time
   */
  trackQueryTime(queryKey, duration, cacheHit = false) {
    this.metrics.queryTimes.push({
      queryKey: JSON.stringify(queryKey),
      duration,
      timestamp: Date.now(),
      cacheHit,
    });

    // Update cache hit/miss stats
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Keep array size manageable
    if (this.metrics.queryTimes.length > this.maxMetricsSize) {
      this.metrics.queryTimes.shift();
    }
  }

  /**
   * Track mutation execution time
   */
  trackMutationTime(mutationKey, duration, success = true) {
    this.metrics.mutationTimes.push({
      mutationKey: JSON.stringify(mutationKey),
      duration,
      success,
      timestamp: Date.now(),
    });

    // Keep array size manageable
    if (this.metrics.mutationTimes.length > this.maxMetricsSize) {
      this.metrics.mutationTimes.shift();
    }
  }

  /**
   * Track errors for monitoring
   */
  trackError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
    });

    // Keep array size manageable
    if (this.metrics.errors.length > this.maxMetricsSize) {
      this.metrics.errors.shift();
    }

    // Log to console in development
    if (__DEV__) {
      console.error("Performance Monitor - Error:", error, context);
    }
  }

  /**
   * Get cache hit rate percentage
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return 0;
    return (this.metrics.cacheHits / total) * 100;
  }

  /**
   * Get average query time
   */
  getAverageQueryTime() {
    if (this.metrics.queryTimes.length === 0) return 0;
    const total = this.metrics.queryTimes.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );
    return total / this.metrics.queryTimes.length;
  }

  /**
   * Get average mutation time
   */
  getAverageMutationTime() {
    if (this.metrics.mutationTimes.length === 0) return 0;
    const total = this.metrics.mutationTimes.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );
    return total / this.metrics.mutationTimes.length;
  }

  /**
   * Get error rate
   */
  getErrorRate() {
    const totalOperations =
      this.metrics.queryTimes.length + this.metrics.mutationTimes.length;
    if (totalOperations === 0) return 0;
    return (this.metrics.errors.length / totalOperations) * 100;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    return {
      cacheHitRate: this.getCacheHitRate().toFixed(2) + "%",
      averageQueryTime: this.getAverageQueryTime().toFixed(2) + "ms",
      averageMutationTime: this.getAverageMutationTime().toFixed(2) + "ms",
      errorRate: this.getErrorRate().toFixed(2) + "%",
      totalQueries: this.metrics.queryTimes.length,
      totalMutations: this.metrics.mutationTimes.length,
      totalErrors: this.metrics.errors.length,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
    };
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    const summary = this.getSummary();
    console.log("=== Performance Monitor Summary ===");
    console.log(summary);
    console.log("===================================");
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      queryTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: [],
      mutationTimes: [],
    };
  }

  /**
   * Export metrics for external monitoring (e.g., Sentry, LogRocket)
   */
  exportMetrics() {
    return {
      ...this.metrics,
      summary: this.getSummary(),
      exportedAt: Date.now(),
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Query integration helpers
export const createPerformanceObserver = (queryClient) => {
  const cache = queryClient.getQueryCache();

  // Observer for queries
  cache.subscribe((event) => {
    if (event.type === "updated") {
      const query = event.query;
      const state = query.state;

      // Track query time
      if (state.dataUpdatedAt > 0) {
        const duration = state.dataUpdatedAt - (state.fetchedAt || 0);
        const cacheHit = state.fetchStatus === "idle" && duration < 10;

        performanceMonitor.trackQueryTime(query.queryKey, duration, cacheHit);
      }

      // Track errors
      if (state.error) {
        performanceMonitor.trackError(state.error, {
          queryKey: query.queryKey,
          type: "query",
        });
      }
    }
  });
};

// Development helper to log performance every 30 seconds
if (__DEV__) {
  setInterval(() => {
    performanceMonitor.logSummary();
  }, 30000);
}
