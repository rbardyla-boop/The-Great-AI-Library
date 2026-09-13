import { canonicalJson, fromUtf8, objectPath, sha256Bytes, utf8 } from "./crypto.ts";
import { Catalog, type CatalogSnapshot } from "./catalog.ts";
import { ContentAddressedStore } from "./objects.ts";
import { HashChainLedger, type ChainEvent } from "./ledger.ts";

export type Bag = Map<string, Uint8Array>;

export interface BagItArchive {
  files: Bag;
  oxum: string;
}

export async function exportBag(args: {
  objects: ContentAddressedStore;
  ledger: HashChainLedger;
  catalog: Catalog;
}): Promise<BagItArchive> {
  const files: Bag = new Map();
  const manifestLines: string[] = [];
  let octets = 0;
  let count = 0;

  const put = async (path: string, bytes: Uint8Array) => {
    files.set(path, bytes);
    const hash = await sha256Bytes(bytes);
    manifestLines.push(`${hash}  ${path}`);
    octets += bytes.length;
    count += 1;
  };

  for (const hash of args.objects.hashes()) {
    const bytes = args.objects.get(hash);
    if (!bytes) continue;
    await put(`data/${objectPath(hash)}`, bytes);
  }
  await put("data/ledger.jsonl", utf8(args.ledger.exportJsonl()));
  await put("data/catalog.json", utf8(canonicalJson(args.catalog.clone())));

  const bagit = utf8("BagIt-Version: 1.0\nTag-File-Character-Encoding: UTF-8\n");
  files.set("bagit.txt", bagit);
  const info = utf8(
    `Source-Organization: Great AI Library\nBagging-Date: ${new Date().toISOString().slice(0, 10)}\nPayload-Oxum: ${octets}.${count}\n`,
  );
  files.set("bag-info.txt", info);
  files.set("manifest-sha256.txt", utf8(manifestLines.sort().join("\n") + "\n"));

  return { files, oxum: `${octets}.${count}` };
}

export async function validateBag(
  files: Bag,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const bagit = files.get("bagit.txt");
  if (!bagit || !fromUtf8(bagit).includes("BagIt-Version: 1.0")) {
    return { ok: false, reason: "missing bagit.txt" };
  }
  const manifest = files.get("manifest-sha256.txt");
  if (!manifest) return { ok: false, reason: "missing manifest-sha256.txt" };
  const lines = fromUtf8(manifest)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const sp = line.indexOf("  ");
    if (sp < 0) return { ok: false, reason: `bad manifest line: ${line}` };
    const hash = line.slice(0, sp);
    const path = line.slice(sp + 2);
    const bytes = files.get(path);
    if (!bytes) return { ok: false, reason: `payload missing: ${path}` };
    const actual = await sha256Bytes(bytes);
    if (actual !== hash) return { ok: false, reason: `fixity failed: ${path}` };
  }
  return { ok: true };
}

export async function restoreBag(files: Bag): Promise<{
  objects: ContentAddressedStore;
  ledger: HashChainLedger;
  catalog: Catalog;
}> {
  const valid = await validateBag(files);
  if (!valid.ok) throw new Error(valid.reason);
  const objects = new ContentAddressedStore();
  for (const [path, bytes] of files) {
    const m = path.match(/^data\/objects\/sha256\/[0-9a-f]{2}\/([0-9a-f]+)$/);
    if (m?.[1]) {
      const hash = path.slice("data/objects/sha256/".length).replace("/", "");
      const put = await objects.put(bytes);
      if (put.hash !== hash) throw new Error(`object path/hash mismatch ${path}`);
    }
  }
  const ledger = new HashChainLedger();
  const ledgerBytes = files.get("data/ledger.jsonl");
  if (ledgerBytes) {
    const events = fromUtf8(ledgerBytes)
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ChainEvent);
    ledger.load(events);
    const verified = await ledger.verify();
    if (!verified.ok) throw new Error(verified.reason);
  }
  const catalog = new Catalog();
  const catalogBytes = files.get("data/catalog.json");
  if (catalogBytes) {
    catalog.load(JSON.parse(fromUtf8(catalogBytes)) as CatalogSnapshot);
  }
  return { objects, ledger, catalog };
}
