//#region node_modules/.nitro/vite/services/ssr/assets/feedback-DK1qzvl0.js
/** Local-only observation for the Library slice. Not Clove Insights. Nothing is transmitted. */
var BEACON_EVENTS = [
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
	"feedback_text_submitted"
];
var QUERY_CATEGORIES = [
	"construction",
	"taekwondo",
	"ai",
	"research",
	"unknown"
];
var FORBIDDEN = [
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
	"user_agent"
];
var SESSION_KEY = "gal-host-session-v1";
var LOG_KEY = "gal-host-beacon-v1";
function classifyQuery(text) {
	const q = text.toLowerCase();
	if (/\b(house|stud|joist|slab|envelope|construction|building code|pei)\b/.test(q)) return "construction";
	if (/\b(taekwondo|tkd|dojang|poomsae|sparring)\b/.test(q)) return "taekwondo";
	if (/\b(ai|model|llm|agent|gal|jev|library)\b/.test(q)) return "ai";
	if (/\b(research|source|paper|evidence|claim|mercury)\b/.test(q)) return "research";
	return "unknown";
}
function dayKey(at) {
	return new Date(at).toISOString().slice(0, 10);
}
function sessionFor(store, at, randomId) {
	const day = dayKey(at);
	const raw = store.get(SESSION_KEY);
	if (raw) try {
		const parsed = JSON.parse(raw);
		if (parsed.id && parsed.day === day) return parsed.id;
	} catch {}
	const id = randomId();
	store.set(SESSION_KEY, JSON.stringify({
		id,
		day
	}));
	return id;
}
function assertBeacon(input) {
	const event = input.event;
	if (typeof event !== "string" || !BEACON_EVENTS.includes(event)) throw new Error("unknown event");
	for (const key of Object.keys(input)) if (FORBIDDEN.includes(key.toLowerCase())) throw new Error(`forbidden field ${key}`);
	const route = input.route;
	const session = input.session;
	if (typeof route !== "string" || route.length > 80 || route.includes("?")) throw new Error("bad route");
	if (typeof session !== "string" || session.length < 8 || session.length > 40) throw new Error("bad session");
	let queryCategory;
	if (input.queryCategory !== void 0) {
		if (!QUERY_CATEGORIES.includes(input.queryCategory)) throw new Error("bad category");
		queryCategory = input.queryCategory;
	}
	return {
		event,
		app: "gal",
		version: "0.1.0",
		route,
		session,
		day: typeof input.day === "string" ? input.day : dayKey(Date.now()),
		queryCategory
	};
}
function readLog(store) {
	const raw = store.get(LOG_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((row) => row && typeof row === "object");
	} catch {
		return [];
	}
}
function recordBeacon(store, input) {
	const row = assertBeacon(input);
	const log = readLog(store);
	log.push(row);
	store.set(LOG_KEY, JSON.stringify(log.slice(-400)));
	return row;
}
function aggregate(rows) {
	const events = {};
	const categories = {};
	const days = /* @__PURE__ */ new Set();
	const sessions = /* @__PURE__ */ new Set();
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
		total: rows.length
	};
}
function memoryStore() {
	const mem = /* @__PURE__ */ new Map();
	return {
		get: (k) => mem.get(k) ?? null,
		set: (k, v) => {
			mem.set(k, v);
		}
	};
}
var fallback = memoryStore();
function store() {
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
		}
	};
}
function randomId() {
	const bytes = /* @__PURE__ */ new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function trackLocal(event, route, extra) {
	const s = store();
	const at = Date.now();
	recordBeacon(s, {
		event,
		route,
		session: sessionFor(s, at, randomId),
		day: new Date(at).toISOString().slice(0, 10),
		queryCategory: extra?.queryCategory
	});
}
function trackSearch(route, query, event) {
	trackLocal(event, route, { queryCategory: classifyQuery(query) });
}
function localInsights() {
	return aggregate(readLog(store()));
}
var KEY = "gal-host-feedback-v1";
function read() {
	if (typeof localStorage === "undefined") return [];
	try {
		const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function saveFeedback(useful, text, receiptId) {
	if (typeof localStorage === "undefined") return;
	const safeReceipt = receiptId && /^[a-z0-9_-]{8,80}$/i.test(receiptId) ? receiptId : void 0;
	const note = {
		at: (/* @__PURE__ */ new Date()).toISOString(),
		useful,
		text: text.trim().slice(0, 500),
		receiptId: safeReceipt
	};
	const notes = read();
	notes.push(note);
	localStorage.setItem(KEY, JSON.stringify(notes.slice(-50)));
}
function readFeedback() {
	return read();
}
//#endregion
export { trackSearch as a, trackLocal as i, readFeedback as n, saveFeedback as r, localInsights as t };
