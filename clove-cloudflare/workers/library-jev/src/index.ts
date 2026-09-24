import { decide, type Judgment } from "./policy";

export interface Env {
  TYPESAFE_API_KEY?: string;
}

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const ORIGINS = new Set(["https://clovelearn.io", "http://127.0.0.1:8787", "http://localhost:8787"]);

const QUESTIONS = {
  supports: {
    type: "noul",
    instructions: "Does the supplied evidence support the claim stated in the query?",
  },
  contradicts: {
    type: "noul",
    instructions: "Does the supplied evidence contradict the claim stated in the query?",
  },
  insufficient: {
    type: "noul",
    instructions: "Is the supplied evidence insufficient to establish either support or contradiction?",
  },
  relevance: {
    type: "noul",
    instructions: "Is this evidence relevant to the claim or query?",
  },
  duplicate: {
    type: "noul",
    instructions: "Does this candidate appear to substantially duplicate another supplied candidate?",
  },
};

const HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

function json(body: object, status: number, origin: string | null): Response {
  const headers = new Headers(HEADERS);
  if (origin && ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Passage {
  id: string;
  title: string;
  text: string;
}

function passagesOf(value: unknown): Passage[] {
  if (!value || typeof value !== "object") return [];
  const raw = (value as { passages?: unknown }).passages;
  if (!Array.isArray(raw)) return [];
  const out: Passage[] = [];
  for (const row of raw.slice(0, 6)) {
    if (!row || typeof row !== "object") continue;
    const text = String((row as { text?: unknown }).text || "").slice(0, 700);
    if (!text.trim()) continue;
    out.push({
      id: String((row as { id?: unknown }).id || "p").slice(0, 80),
      title: String((row as { title?: unknown }).title || "Source").slice(0, 180),
      text,
    });
  }
  return out;
}

function interpret(answers: Record<string, { type?: string; noul?: number; confidence?: number; probabilities?: Record<string, number> }> | undefined): Judgment[] {
  const views: Judgment[] = [];
  for (const id of Object.keys(QUESTIONS)) {
    const raw = answers?.[id];
    if (!raw) continue;
    let probabilities: Record<string, number> = {};
    if (raw.type === "noul" && typeof raw.noul === "number") {
      const yes = Math.min(1, Math.max(0, raw.noul));
      probabilities = { yes, no: Math.round((1 - yes) * 10000) / 10000 };
    } else if (raw.probabilities) {
      for (const [k, v] of Object.entries(raw.probabilities)) {
        if (typeof v === "number") probabilities[k] = Math.min(1, Math.max(0, v));
      }
    }
    if (!Object.keys(probabilities).length) continue;
    views.push({
      id,
      confidence: typeof raw.confidence === "number" ? raw.confidence : null,
      probabilities,
    });
  }
  return views;
}

async function callJev(key: string, state: object): Promise<{ terminal: string; model: string; http: number | null; judgments: Judgment[]; requestId: string | null }> {
  let retries = 0;
  while (true) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ state, model: MODEL, questions: QUESTIONS }),
    });
    const requestId = res.headers.get("x-request-id") || res.headers.get("request-id");
    if (res.ok) {
      let body: { model?: string; answers?: Record<string, { type?: string; noul?: number; confidence?: number; probabilities?: Record<string, number> }> };
      try {
        body = await res.json();
      } catch {
        return { terminal: "INVALID_RESPONSE", model: "none", http: res.status, judgments: [], requestId };
      }
      const judgments = interpret(body.answers);
      if (!judgments.length) {
        return { terminal: "INVALID_RESPONSE", model: body.model || MODEL, http: res.status, judgments: [], requestId };
      }
      return { terminal: "ACCEPTED_RESPONSE", model: body.model || MODEL, http: res.status, judgments, requestId };
    }
    const terminal =
      res.status === 401 || res.status === 403
        ? "AUTH_FAILURE"
        : res.status === 429
          ? "RATE_LIMITED"
          : res.status === 529
            ? "OVERLOADED"
            : res.status === 400 || res.status === 422
              ? "REJECTED_RESPONSE"
              : "NETWORK_FAILURE";
    if ((res.status === 429 || res.status === 529) && retries < 2) {
      retries += 1;
      const hinted = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(hinted) ? Math.min(2000, hinted * 1000) : 200 * 2 ** (retries - 1);
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }
    return { terminal, model: "none", http: res.status, judgments: [], requestId };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      return json({ ok: true }, 204, origin);
    }
    if (url.pathname !== "/__clove/jev") return json({ ok: false, code: "not_found" }, 404, origin);

    if (request.method === "GET") {
      return json(
        { ok: true, service: "clove-library-jev", key: env.TYPESAFE_API_KEY?.trim() ? "present" : "absent" },
        200,
        origin,
      );
    }
    if (request.method !== "POST") return json({ ok: false, code: "method" }, 405, origin);
    if (origin && !ORIGINS.has(origin)) return json({ ok: false, code: "origin" }, 403, origin);

    let payload: { query?: unknown; passages?: unknown };
    try {
      payload = (await request.json()) as { query?: unknown };
    } catch {
      return json({ ok: false, code: "invalid_body" }, 400, origin);
    }
    const query = String(payload.query || "").trim().slice(0, 500);
    const passages = passagesOf(payload);
    if (!query || passages.length === 0) return json({ ok: false, code: "empty" }, 400, origin);

    const inputHash = await sha256(JSON.stringify({ query, passages: passages.map((p) => p.text) }));
    const key = env.TYPESAFE_API_KEY?.trim();
    const called = key
      ? await callJev(key, {
          query,
          passages: passages.map((p) => ({ id: p.id, title: p.title, text: p.text })),
        }).catch(() => ({
          terminal: "NETWORK_FAILURE" as const,
          model: "none",
          http: null,
          judgments: [] as Judgment[],
          requestId: null,
        }))
      : { terminal: "NO_KEY" as const, model: "none", http: null, judgments: [] as Judgment[], requestId: null };

    const decision = decide(called.terminal, called.judgments);
    const body = {
      ok: true,
      requestedModel: MODEL,
      model: called.model,
      terminal: called.terminal,
      http: called.http,
      requestId: called.requestId,
      inputHash,
      judgments: called.judgments,
      decision,
      authority: false,
    };
    const encoded = JSON.stringify(body);
    if (key && encoded.includes(key)) return json({ ok: false, code: "redacted" }, 500, origin);
    return json(body, 200, origin);
  },
} satisfies ExportedHandler<Env>;
