const MAX_SAMPLES = 120;

const metrics = {
  renders: 0,
  saves: 0,
  actions: Object.create(null)
};

function ensureAction(name) {
  const key = String(name || 'unknown');
  if (!metrics.actions[key]) {
    metrics.actions[key] = { count: 0, totalMs: 0, samples: [] };
  }
  return metrics.actions[key];
}

export function trackRenderCall() {
  metrics.renders += 1;
}

export function trackSaveCall() {
  metrics.saves += 1;
}

export function trackActionDuration(name, durationMs) {
  const action = ensureAction(name);
  const safeDuration = Math.max(0, Number(durationMs) || 0);
  action.count += 1;
  action.totalMs += safeDuration;
  action.samples.push(safeDuration);
  if (action.samples.length > MAX_SAMPLES) {
    action.samples = action.samples.slice(-MAX_SAMPLES);
  }
}

export function getPerfMetricsSnapshot() {
  const actions = {};
  Object.keys(metrics.actions).forEach((key) => {
    const item = metrics.actions[key];
    const averageMs = item.count > 0 ? (item.totalMs / item.count) : 0;
    actions[key] = {
      count: item.count,
      totalMs: Number(item.totalMs.toFixed(3)),
      averageMs: Number(averageMs.toFixed(3)),
      samples: item.samples.slice()
    };
  });
  return {
    renders: metrics.renders,
    saves: metrics.saves,
    actions
  };
}

export function resetPerfMetrics() {
  metrics.renders = 0;
  metrics.saves = 0;
  metrics.actions = Object.create(null);
}

if (typeof window !== 'undefined') {
  // Expose metrics to devtools without altering gameplay behavior.
  window.__ETM_PERF = {
    get snapshot() {
      return getPerfMetricsSnapshot();
    },
    reset: resetPerfMetrics
  };
}
