/** Local-only observation for the Library slice. Not Clove Insights. Nothing is transmitted. */

export const BEACON_EVENTS = [
  "page_open",
  "library_open",
  "record_open",
  "search_started",
  "search_completed",
  "library_query_started",
  "library_query_completed",
  "jev_success",
  "jev_service_failure",
  "human_review_required",
  "lab_started",
  "lab_completed",
  "feedback_yes",
  "feedback_no",
  "feedback_text_submitted",
] as const;

export type BeaconEvent = (typeof BEACON_EVENTS)[number];

export const QUERY_CATEGORIES = ["construction", "taekwondo", "ai", "research", "unknown"] as const;
export type QueryCategory = (typeof QUERY_CATEGORIES)[number];

const FORBIDDEN = [
  "ip",
  "email",
  "name",
  "query",
  "body",
  "document",
  "content",
  "passage",
  "fingerprint",
  "secret",
  "useragent",
  "user_agent",
];

export interface BeaconRecord {
  event: BeaconEvent;
  app: "gal";
  version: "0.1.0";
  route: string;
  session: string;
  day: string;
  queryCategory?: QueryCategory;
}

export interface BeaconStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

const SESSION_KEY = "gal-host-session-v1";
const LOG_KEY = "gal-host-beacon-v1";

export function classifyQuery(text: string): QueryCategory {
  const q = text.toLowerCase();
  if (/\b(house|stud|joist|slab|envelope|construction|building code|pei)\b/.test(q)) return "construction";
  if (/\b(taekwondo|tkd|dojang|poomsae|sparring)\b/.test(q)) return "taekwondo";
  if (/\b(ai|model|llm|agent|gal|jev|library)\b/.test(q)) return "ai";
  if (/\b(research|source|paper|evidence|claim|mercury)\b/.test(q)) return "research";
  return "unknown";
}

export function dayKey(at: number): string {
  return new Date(at).toISOString().slice(0, 10);
}

export function sessionFor(store: BeaconStore, at: number, randomId: () => string): string {
  const day = dayKey(at);
  const raw = store.get(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { id?: string; day?: string };
      if (parsed.id && parsed.day === day) return parsed.id;
    } catch {
      /* rotate */
    }
  }
  const id = randomId();
  store.set(SESSION_KEY, JSON.stringify({ id, day }));
  return id;
}

export function assertBeacon(input: Record<string, unknown>): BeaconRecord {
  const event = input.event;
  if (typeof event !== "string" || !BEACON_EVENTS.includes(event as BeaconEvent)) {
    throw new Error("unknown event");
  }
  for (const key of Object.keys(input)) {
    if (FORBIDDEN.includes(key.toLowerCase())) throw new Error(`forbidden field ${key}`);
  }
  const route = input.route;
  const session = input.session;
  if (typeof route !== "string" || route.length > 80 || route.includes("?")) throw new Error("bad route");
  if (typeof session !== "string" || session.length < 8 || session.length > 40) throw new Error("bad session");
  let queryCategory: QueryCategory | undefined;
  if (input.queryCategory !== undefined) {
    if (!QUERY_CATEGORIES.includes(input.queryCategory as QueryCategory)) throw new Error("bad category");
    queryCategory = input.queryCategory as QueryCategory;
  }
  return {
    event: event as BeaconEvent,
    app: "gal",
    version: "0.1.0",
    route,
    session,
    day: typeof input.day === "string" ? input.day : dayKey(Date.now()),
    queryCategory,
  };
}

export function readLog(store: BeaconStore): BeaconRecord[] {
  const raw = store.get(LOG_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row === "object") as BeaconRecord[];
  } catch {
    return [];
  }
}

export function recordBeacon(store: BeaconStore, input: Record<string, unknown>): BeaconRecord {
  const row = assertBeacon(input);
  const log = readLog(store);
  log.push(row);
  store.set(LOG_KEY, JSON.stringify(log.slice(-400)));
  return row;
}

export function aggregate(rows: BeaconRecord[]) {
  const events: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const days = new Set<string>();
  const sessions = new Set<string>();
  for (const row of rows) {
    events[row.event] = (events[row.event] ?? 0) + 1;
    sessions.add(`${row.day}:${row.session}`);
    days.add(row.day);
    if (row.queryCategory) categories[row.queryCategory] = (categories[row.queryCategory] ?? 0) + 1;
  }
  return {
    events,
    categories,
    sessionDays: sessions.size,
    distinctDays: days.size,
    total: rows.length,
  };
}
