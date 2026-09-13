import { canonicalJson, hmacSha256, hmacSha256Verify, sha256Text } from "./crypto.ts";
import type { Librarian, LibrarianPermissions } from "../library/types.ts";

export const GAL_PUBLISHER = "Great AI Library Project";
export const GAL_PUBLISHER_KEY =
  "a63bed2ca4456577bc5406561d3ec7f849fe294749d7e96997bad6143835f859";

export interface LibrarianManifest {
  identity: string;
  version: string;
  publisher: string;
  permissions: LibrarianPermissions;
  scopes: string[];
  package_hash: string;
}

export interface SignedLibrarian {
  librarian: Librarian;
  manifest: LibrarianManifest;
  signature: string;
}

export async function hashManifestBody(manifest: Omit<LibrarianManifest, "package_hash">): Promise<string> {
  return sha256Text(canonicalJson(manifest));
}

export async function signLibrarian(librarian: Librarian, publisherKey = GAL_PUBLISHER_KEY): Promise<SignedLibrarian> {
  const unsigned = {
    identity: librarian.id,
    version: librarian.version,
    publisher: librarian.publisher,
    permissions: librarian.permissions,
    scopes: librarian.scopes,
  };
  const package_hash = await hashManifestBody(unsigned);
  const manifest: LibrarianManifest = { ...unsigned, package_hash };
  const signature = await hmacSha256(publisherKey, canonicalJson(manifest));
  return {
    librarian: {
      ...librarian,
      signature: librarian.publisher === GAL_PUBLISHER ? "verified" : "unverified",
      source: librarian.publisher === GAL_PUBLISHER ? "public" : "unsigned",
    },
    manifest,
    signature,
  };
}

export async function verifyLibrarianPackage(
  signed: SignedLibrarian,
): Promise<{ ok: boolean; reason: string }> {
  if (signed.librarian.publisher !== GAL_PUBLISHER && signed.manifest.publisher !== GAL_PUBLISHER) {
    return { ok: false, reason: "Unknown publisher. Package is not trusted." };
  }
  const unsigned = {
    identity: signed.manifest.identity,
    version: signed.manifest.version,
    publisher: signed.manifest.publisher,
    permissions: signed.manifest.permissions,
    scopes: signed.manifest.scopes,
  };
  const package_hash = await hashManifestBody(unsigned);
  if (package_hash !== signed.manifest.package_hash) {
    return { ok: false, reason: "package hash mismatch" };
  }
  const good = await hmacSha256Verify(
    GAL_PUBLISHER_KEY,
    canonicalJson(signed.manifest),
    signed.signature,
  );
  if (!good) return { ok: false, reason: "signature verification failed" };
  return { ok: true, reason: "verified" };
}
