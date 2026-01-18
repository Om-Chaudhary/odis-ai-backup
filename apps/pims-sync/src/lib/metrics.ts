/**
 * Metrics Service
 *
 * Collects and exports metrics for monitoring.
 * Simple in-memory implementation for observability.
 */

interface MetricHistogram {
  count: number;
  sum: number;
  min: number;
  max: number;
  buckets: Map<number, number>; // bucket upper bound -> count
}

interface MetricCounter {
  value: number;
}

interface MetricGauge {
  value: number;
}

/**
 * Simple metrics collector
 */
export class MetricsService {
  private static instance: MetricsService;

  private histograms = new Map<string, MetricHistogram>();
  private counters = new Map<string, MetricCounter>();
  private gauges = new Map<string, MetricGauge>();
  private startTime = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Record a value in a histogram
   */
  recordHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        buckets: new Map([
          [10, 0],
          [50, 0],
          [100, 0],
          [500, 0],
          [1000, 0],
          [5000, 0],
          [10000, 0],
          [30000, 0],
          [60000, 0],
          [Infinity, 0],
        ]),
      });
    }

    const histogram = this.histograms.get(name)!;
    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);

    // Update buckets
    for (const [upperBound, count] of histogram.buckets.entries()) {
      if (value <= upperBound) {
        histogram.buckets.set(upperBound, count + 1);
      }
    }
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, delta = 1): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, { value: 0 });
    }
    this.counters.get(name)!.value += delta;
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, { value: 0 });
    }
    this.gauges.get(name)!.value = value;
  }

  /**
   * Export metrics in simple text format
   */
  export(): string {
    const lines: string[] = [];
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - this.startTime) / 1000);

    // System metrics
    lines.push(`# HELP process_uptime_seconds Process uptime in seconds`);
    lines.push(`# TYPE process_uptime_seconds gauge`);
    lines.push(`process_uptime_seconds ${uptimeSeconds}`);
    lines.push("");

    lines.push(`# HELP process_memory_bytes Process memory usage in bytes`);
    lines.push(`# TYPE process_memory_bytes gauge`);
    lines.push(`process_memory_bytes ${process.memoryUsage().heapUsed}`);
    lines.push("");

    // Counters
    for (const [name, counter] of this.counters.entries()) {
      lines.push(`# HELP ${name} Counter metric`);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${counter.value}`);
      lines.push("");
    }

    // Gauges
    for (const [name, gauge] of this.gauges.entries()) {
      lines.push(`# HELP ${name} Gauge metric`);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${gauge.value}`);
      lines.push("");
    }

    // Histograms
    for (const [name, histogram] of this.histograms.entries()) {
      const avg = histogram.count > 0 ? histogram.sum / histogram.count : 0;

      lines.push(`# HELP ${name} Histogram metric`);
      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${name}_count ${histogram.count}`);
      lines.push(`${name}_sum ${histogram.sum}`);
      lines.push(`${name}_avg ${avg.toFixed(2)}`);
      lines.push(
        `${name}_min ${histogram.min === Infinity ? 0 : histogram.min}`,
      );
      lines.push(
        `${name}_max ${histogram.max === -Infinity ? 0 : histogram.max}`,
      );

      // Buckets
      for (const [upperBound, count] of histogram.buckets.entries()) {
        const le = upperBound === Infinity ? "+Inf" : upperBound.toString();
        lines.push(`${name}_bucket{le="${le}"} ${count}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.histograms.clear();
    this.counters.clear();
    this.gauges.clear();
  }
}

// Export singleton
export const metrics = MetricsService.getInstance();

/**
 * Helper to time an async function and record duration
 */
export async function timed<T>(
  metricName: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metrics.recordHistogram(metricName, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metrics.recordHistogram(metricName, duration);
    metrics.incrementCounter(`${metricName}_errors`);
    throw error;
  }
}
