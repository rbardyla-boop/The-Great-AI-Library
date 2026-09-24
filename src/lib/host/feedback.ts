/** Explicit notes stay on this device. They are not beacon events and they are not uploaded. */

export interface FeedbackNote {
  at: string;
  useful: "yes" | "no" | "text";
  text: string;
  /** Non-sensitive receipt id. Never a claim or a passage. */
  receiptId?: string;
}

const KEY = "gal-host-feedback-v1";

function read(): FeedbackNote[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as FeedbackNote[]) : [];
  } catch {
    return [];
  }
}

export function saveFeedback(useful: FeedbackNote["useful"], text: string, receiptId?: string): void {
  if (typeof localStorage === "undefined") return;
  const safeReceipt = receiptId && /^[a-z0-9_-]{8,80}$/i.test(receiptId) ? receiptId : undefined;
  const note: FeedbackNote = {
    at: new Date().toISOString(),
    useful,
    text: text.trim().slice(0, 500),
    receiptId: safeReceipt,
  };
  const notes = read();
  notes.push(note);
  localStorage.setItem(KEY, JSON.stringify(notes.slice(-50)));
}

export function readFeedback(): FeedbackNote[] {
  return read();
}
