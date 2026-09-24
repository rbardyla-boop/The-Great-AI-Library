/**
 * Coarse events for the existing Clove Insights worker.
 * This module does not transmit. The worker allowlist does not include these
 * names yet, and this Reading Room is not clovelearn.io.
 */

export const CLOVE_LIBRARY_EVENTS = [
  "library_open",
  "library_query_started",
  "library_query_completed",
  "jev_success",
  "jev_service_failure",
  "human_review_required",
  "feedback_yes",
  "feedback_no",
] as const;

export type CloveLibraryEvent = (typeof CLOVE_LIBRARY_EVENTS)[number];

const FORBIDDEN = [
  "query",
  "claim",
  "body",
  "passage",
  "document",
  "excerpt",
  "ip",
  "email",
  "response",
  "answers",
  "probabilities",
  "authorization",
  "apiKey",
  "api_key",
];

export interface CloveSignal {
  event: CloveLibraryEvent;
  surface: "library";
  device: "mobile" | "desktop" | "unknown";
}

/** Transmit stays off until the page is on clovelearn.io and the allowlist is extended. */
export const INSIGHTS_TRANSMIT = false;

export function prepareCloveSignal(input: Record<string, unknown>): CloveSignal {
  for (const key of Object.keys(input)) {
    if (FORBIDDEN.includes(key)) throw new Error(`insights refused ${key}`);
  }
  const event = input.event;
  if (typeof event !== "string" || !CLOVE_LIBRARY_EVENTS.includes(event as CloveLibraryEvent)) {
    throw new Error("insights refused event");
  }
  const device = input.device;
  if (device !== "mobile" && device !== "desktop" && device !== "unknown") {
    throw new Error("insights refused device");
  }
  return { event: event as CloveLibraryEvent, surface: "library", device };
}
