import type { Actor } from "./ledger.ts";
import type { InstalledLibrarian } from "./catalog.ts";
import type { LibrarianPermissions } from "../library/types.ts";

export const CAPABILITY_COMMANDS = new Set([
  "GRANT_CAPABILITY",
  "INSTALL_LIBRARIAN",
  "UPGRADE_LIBRARIAN",
]);

export interface PolicyRequest {
  actor: Actor;
  command: string;
  untrustedInputs?: boolean;
  requested?: Partial<LibrarianPermissions>;
  previous?: InstalledLibrarian | null;
  signed?: boolean;
  publisherTrusted?: boolean;
}

export interface PolicyDecision {
  allow: boolean;
  reason: string;
}

const DEFAULT_PERMS: LibrarianPermissions = {
  "library.read": false,
  "derivatives.write": false,
  "sources.write": false,
  network: false,
  shell: false,
};

export function expandedPermissions(
  previous: LibrarianPermissions | undefined,
  next: LibrarianPermissions,
): string[] {
  const prev = previous ?? DEFAULT_PERMS;
  const keys = Object.keys(next) as (keyof LibrarianPermissions)[];
  return keys.filter((k) => next[k] === true && prev[k] !== true);
}

export function authorize(req: PolicyRequest): PolicyDecision {
  if (req.actor === "document") {
    return { allow: false, reason: "Documents cannot issue commands or grant capabilities." };
  }
  if (req.untrustedInputs && CAPABILITY_COMMANDS.has(req.command)) {
    return { allow: false, reason: "Untrusted content cannot change capabilities." };
  }
  if (req.command === "MUTATE_ORIGINAL") {
    return { allow: false, reason: "Original bytes are immutable." };
  }
  if (req.command === "GRANT_CAPABILITY") {
    return { allow: false, reason: "Capabilities are declared in signed manifests, not granted ad hoc." };
  }
  if (req.command === "INSTALL_LIBRARIAN" || req.command === "UPGRADE_LIBRARIAN") {
    if (!req.signed || !req.publisherTrusted) {
      return { allow: false, reason: "Install stopped. Signature or publisher is not trusted." };
    }
    const requested = {
      ...DEFAULT_PERMS,
      ...req.requested,
    } as LibrarianPermissions;
    if (req.command === "UPGRADE_LIBRARIAN") {
      const expansions = expandedPermissions(req.previous?.permissions, requested);
      if (expansions.length) {
        return {
          allow: false,
          reason: `PERMISSION EXPANSION DETECTED: ${expansions.join(", ")}`,
        };
      }
    }
    if (requested.shell || requested.network || requested["sources.write"]) {
      return {
        allow: false,
        reason: "Install stopped. This package requests shell, network, or the right to modify original evidence.",
      };
    }
  }
  return { allow: true, reason: "ok" };
}
