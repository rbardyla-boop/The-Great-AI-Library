import { LibraryKernel } from "./kernel.ts";
import { seedMercury } from "./seed.ts";

const DB_NAME = "gal-kernel-v2";
const STORE = "snapshot";

function hasIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveKernel(kernel: LibraryKernel): Promise<void> {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  const payload = {
    objects: kernel.objects.exportAll(),
    catalog: kernel.catalog.clone(),
    ledger: kernel.ledger.events,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(payload, "library");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadKernel(kernel: LibraryKernel): Promise<boolean> {
  if (!hasIndexedDb()) return false;
  const db = await openDb();
  const payload = await new Promise<
    | {
        objects: Record<string, number[]>;
        catalog: ReturnType<LibraryKernel["catalog"]["clone"]>;
        ledger: LibraryKernel["ledger"]["events"];
      }
    | undefined
  >((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get("library");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!payload?.ledger?.length) return false;
  kernel.objects.importAll(payload.objects);
  kernel.catalog.load(payload.catalog);
  kernel.ledger.load(payload.ledger);
  return true;
}

export async function clearKernelStore(): Promise<void> {
  if (!hasIndexedDb()) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete("library");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function bootKernel(kernel: LibraryKernel): Promise<void> {
  const loaded = await loadKernel(kernel);
  if (!loaded || kernel.empty) {
    await seedMercury(kernel);
    await saveKernel(kernel);
  }
}
