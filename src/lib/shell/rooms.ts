/** Canonical Reading Room chrome. Update this AND the shell together. */
export const CANONICAL_ROOMS = [
  { to: "/", label: "Stacks" },
  { to: "/ask", label: "Ask" },
  { to: "/chamber", label: "Chamber" },
  { to: "/desk", label: "Desk" },
  { to: "/inbox", label: "Inbox" },
  { to: "/exchange", label: "Exchange" },
  { to: "/values", label: "VALUES" },
  { to: "/ledger", label: "Ledger" },
  { to: "/constitution", label: "Constitution" },
] as const;

export const MOBILE_ROOMS = ["Stacks", "Ask", "Chamber", "Inbox", "Exchange"] as const;

export const SHELL_INVARIANT =
  "READING-ROOM SHELL — structural preservation. A change fails if any canonical room disappears, the local-store notice obstructs navigation, or the primary shell materially deviates from this list without an explicit baseline update.";
