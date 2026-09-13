export type EnvelopeKind =
  | "WORK"
  | "CLAIM"
  | "EVIDENCE"
  | "VERIFICATION"
  | "RECEIPT"
  | "QUERY"
  | "CANCEL"
  | "HEARTBEAT";

export interface HiveEnvelope {
  protocol: "open-hive/1";
  message_id: string;
  trace_id: string;
  sender: string;
  recipient: string;
  kind: EnvelopeKind;
  epoch: string;
  law_root: string;
  created_at: string;
  expires_at: string;
  sequence: number;
  nonce: string;
  payload_ref: string;
  payload_hash: string;
  capabilities_used: string[];
  signature: string;
}

export function haveNeed(local: Set<string>, cid: string): "HAVE" | "NEED" {
  return local.has(cid) ? "HAVE" : "NEED";
}
