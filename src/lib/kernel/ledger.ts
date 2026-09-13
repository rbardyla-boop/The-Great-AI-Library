import {
  POLICY_VERSION,
  ZERO_HASH,
  canonicalJson,
  sha256Text,
} from "./crypto.ts";

export type Actor = "archivist" | "human" | "librarian" | "policy" | "document";

export interface ChainEvent {
  event_id: string;
  sequence: number;
  timestamp: string;
  actor: Actor;
  command: string;
  payload: unknown;
  payload_hash: string;
  previous_event_hash: string;
  event_hash: string;
  policy_version: string;
  input_entities: string[];
  output_entities: string[];
  result: "ok" | "denied" | "failed";
  summary: string;
}

export interface AppendInput {
  timestamp: string;
  actor: Actor;
  command: string;
  payload?: unknown;
  input_entities?: string[];
  output_entities?: string[];
  result: ChainEvent["result"];
  summary: string;
}

export class LedgerBreakError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerBreakError";
  }
}

export class HashChainLedger {
  readonly events: ChainEvent[] = [];

  get head(): string {
    return this.events.at(-1)?.event_hash ?? ZERO_HASH;
  }

  get length(): number {
    return this.events.length;
  }

  async append(input: AppendInput): Promise<ChainEvent> {
    const payload = input.payload ?? {};
    const payload_hash = await sha256Text(canonicalJson(payload));
    const sequence = this.events.length + 1;
    const previous_event_hash = this.head;
    const unsigned = {
      sequence,
      timestamp: input.timestamp,
      actor: input.actor,
      command: input.command,
      payload,
      payload_hash,
      previous_event_hash,
      policy_version: POLICY_VERSION,
      input_entities: input.input_entities ?? [],
      output_entities: input.output_entities ?? [],
      result: input.result,
      summary: input.summary,
    };
    const event_hash = await sha256Text(canonicalJson(unsigned));
    const event: ChainEvent = {
      event_id: `evt-${String(sequence).padStart(6, "0")}`,
      ...unsigned,
      event_hash,
    };
    this.events.push(event);
    return event;
  }

  async verify(): Promise<{ ok: true } | { ok: false; at: number; reason: string }> {
    let prev = ZERO_HASH;
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i]!;
      if (ev.previous_event_hash !== prev) {
        return { ok: false, at: i, reason: `previous hash mismatch at ${ev.event_id}` };
      }
      const payload_hash = await sha256Text(canonicalJson(ev.payload));
      if (payload_hash !== ev.payload_hash) {
        return { ok: false, at: i, reason: `payload hash mismatch at ${ev.event_id}` };
      }
      const unsigned = {
        sequence: ev.sequence,
        timestamp: ev.timestamp,
        actor: ev.actor,
        command: ev.command,
        payload: ev.payload,
        payload_hash: ev.payload_hash,
        previous_event_hash: ev.previous_event_hash,
        policy_version: ev.policy_version,
        input_entities: ev.input_entities,
        output_entities: ev.output_entities,
        result: ev.result,
        summary: ev.summary,
      };
      const expected = await sha256Text(canonicalJson(unsigned));
      if (expected !== ev.event_hash) {
        return { ok: false, at: i, reason: `event hash mismatch at ${ev.event_id}` };
      }
      prev = ev.event_hash;
    }
    return { ok: true };
  }

  exportJsonl(): string {
    return this.events.map((e) => canonicalJson(e)).join("\n") + (this.events.length ? "\n" : "");
  }

  load(events: ChainEvent[]): void {
    this.events.splice(0, this.events.length, ...events);
  }
}
