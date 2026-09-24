import { aggregate, classifyQuery, readLog, recordBeacon, sessionFor, type BeaconEvent, type BeaconStore, type QueryCategory } from "./beacon.ts";

function memoryStore(): BeaconStore {
  const mem = new Map<string, string>();
  return {
    get: (k) => mem.get(k) ?? null,
    set: (k, v) => {
      mem.set(k, v);
    },
  };
}

let fallback = memoryStore();

function store(): BeaconStore {
  if (typeof localStorage === "undefined") return fallback;
  return {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return fallback.get(k);
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        fallback.set(k, v);
      }
    },
  };
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function trackLocal(
  event: BeaconEvent,
  route: string,
  extra?: { queryCategory?: QueryCategory },
): void {
  const s = store();
  const at = Date.now();
  recordBeacon(s, {
    event,
    route,
    session: sessionFor(s, at, randomId),
    day: new Date(at).toISOString().slice(0, 10),
    queryCategory: extra?.queryCategory,
  });
}

export function trackSearch(
  route: string,
  query: string,
  event: "search_started" | "search_completed" | "library_query_started" | "library_query_completed",
): void {
  trackLocal(event, route, { queryCategory: classifyQuery(query) });
}

export function localInsights() {
  return aggregate(readLog(store()));
}

export function resetFallbackForTests(): void {
  fallback = memoryStore();
}
