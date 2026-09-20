export type MetricSnapshot = { startedAt: string; requests: number; errors: number; authFailures: number; syncFailures: number; duplicateEvents: number; databaseErrors: number; slowRequests: number };
const state = { startedAt: new Date().toISOString(), requests: 0, errors: 0, authFailures: 0, syncFailures: 0, duplicateEvents: 0, databaseErrors: 0, slowRequests: 0 };
export function recordRequest(durationMs: number, statusCode: number) { state.requests += 1; if (statusCode >= 500) state.errors += 1; if (statusCode === 401 || statusCode === 403) state.authFailures += 1; if (durationMs >= 1000) state.slowRequests += 1; }
export function recordMetric(name: keyof Omit<MetricSnapshot, 'startedAt' | 'requests' | 'errors' | 'slowRequests'>) { state[name] += 1; }
export function snapshotMetrics(): MetricSnapshot { return { ...state }; }
