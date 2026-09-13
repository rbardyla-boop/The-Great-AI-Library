import type { Claim, Collection, Contradiction, DeskItem, Entity, LibraryRecord, Relationship } from "../library/types.ts";

export type ProvRelation =
  | "wasDerivedFrom"
  | "wasGeneratedBy"
  | "wasAssociatedWith"
  | "wasAttributedTo";

export interface ProvEntity {
  id: string;
  role: "original" | "representation" | "claim" | "summary" | "classification" | "index" | "bag";
  objectHash?: string;
  recordId?: string;
}

export interface ProvActivity {
  id: string;
  kind: string;
  at: string;
  eventHash: string;
}

export interface ProvAgent {
  id: string;
  kind: "human" | "archivist" | "model" | "librarian" | "policy";
  name: string;
}

export interface ProvEdge {
  id: string;
  relation: ProvRelation;
  fromId: string;
  toId: string;
}

export interface CatalogSnapshot {
  records: LibraryRecord[];
  claims: Claim[];
  entities: Entity[];
  relationships: Relationship[];
  contradictions: Contradiction[];
  collections: Collection[];
  desk: DeskItem[];
  indexes: Record<string, string[]>;
  provEntities: ProvEntity[];
  provActivities: ProvActivity[];
  provAgents: ProvAgent[];
  provEdges: ProvEdge[];
  installed: InstalledLibrarian[];
}

export interface InstalledLibrarian {
  id: string;
  version: string;
  publisher: string;
  permissions: {
    "library.read": boolean;
    "derivatives.write": boolean;
    "sources.write": boolean;
    network: boolean;
    shell: boolean;
  };
  packageHash: string;
  signature: string;
}

export function emptyCatalog(): CatalogSnapshot {
  return {
    records: [],
    claims: [],
    entities: [],
    relationships: [],
    contradictions: [],
    collections: [],
    desk: [],
    indexes: {},
    provEntities: [],
    provActivities: [],
    provAgents: [],
    provEdges: [],
    installed: [],
  };
}

export class Catalog {
  data: CatalogSnapshot = emptyCatalog();

  reset(): void {
    this.data = emptyCatalog();
  }

  load(snapshot: CatalogSnapshot): void {
    this.data = structuredClone(snapshot);
  }

  clone(): CatalogSnapshot {
    return structuredClone(this.data);
  }

  recordById(id: string): LibraryRecord | undefined {
    return this.data.records.find((r) => r.id === id);
  }

  recordsByUri(uri: string): LibraryRecord[] {
    return this.data.records.filter((r) => r.originalUri === uri);
  }

  recordsByHash(hash: string): LibraryRecord[] {
    return this.data.records.filter((r) => r.contentHash === hash);
  }

  upsertRecord(record: LibraryRecord): void {
    const i = this.data.records.findIndex((r) => r.id === record.id);
    if (i >= 0) this.data.records[i] = record;
    else this.data.records.push(record);
  }

  removeDerivatives(): LibraryRecord[] {
    const removed = this.data.records.filter((r) => r.kind === "derivative");
    const removedIds = new Set(removed.map((r) => r.id));
    this.data.records = this.data.records.filter((r) => r.kind === "original");
    this.data.claims = this.data.claims.filter((c) => !removedIds.has(c.recordId) && c.strength !== "derived");
    this.data.provEntities = this.data.provEntities.filter((e) => e.role === "original");
    this.data.provEdges = this.data.provEdges.filter(
      (e) =>
        this.data.provEntities.some((x) => x.id === e.fromId) &&
        this.data.provEntities.some((x) => x.id === e.toId),
    );
    this.data.desk = this.data.desk.filter((d) => d.kind !== "unsupported");
    return removed;
  }
}
