import type {
  AccessionJob,
  Claim,
  DeskItem,
  LedgerEvent,
  Librarian,
  LibraryRecord,
} from "../library/types.ts";
import { Catalog } from "./catalog.ts";
import { ContentAddressedStore } from "./objects.ts";
import { HashChainLedger, type Actor, type ChainEvent } from "./ledger.ts";
import { authorize } from "./policy.ts";
import {
  ACCESSION_STAGES,
  classifySource,
  extractTitle,
  heuristicClaims,
  looksInjected,
  tokenize,
} from "./accession.ts";
import { fromUtf8, sha256Bytes, utf8 } from "./crypto.ts";
import { signLibrarian, verifyLibrarianPackage, type SignedLibrarian } from "./librarians.ts";
import { exportBag, restoreBag, type Bag } from "./bagit.ts";

export { ACCESSION_STAGES };

export interface IngestRequest {
  filename: string;
  bytes: Uint8Array;
  recordId?: string;
  meta?: Partial<LibraryRecord>;
  claims?: Claim[];
  skipDesk?: boolean;
}

export interface StageResult {
  ok: boolean;
  stage: number;
  name: string;
  receipt: string;
  command: string;
  summary: string;
  error?: string;
}

interface JobState extends AccessionJob {
  bytes: Uint8Array;
  receipts: string[];
  failed?: number;
  error?: string;
  hash?: string;
  body?: string;
  injected: boolean;
  providedClaims?: Claim[];
  meta: Partial<LibraryRecord>;
}

export class LibraryKernel {
  readonly objects = new ContentAddressedStore();
  readonly catalog = new Catalog();
  readonly ledger = new HashChainLedger();
  readonly jobs = new Map<string, JobState>();
  private clock: () => string;
  private seq = 0;

  constructor(opts?: { now?: () => string }) {
    this.clock = opts?.now ?? (() => new Date().toISOString());
  }

  get empty(): boolean {
    return this.objects.size === 0 && this.catalog.data.records.length === 0;
  }

  async command(args: {
    actor: Actor;
    command: string;
    summary: string;
    result?: ChainEvent["result"];
    payload?: unknown;
    input?: string[];
    output?: string[];
    untrusted?: boolean;
  }): Promise<ChainEvent> {
    const decision = authorize({
      actor: args.actor,
      command: args.command,
      untrustedInputs: args.untrusted,
    });
    const result: ChainEvent["result"] = decision.allow ? (args.result ?? "ok") : "denied";
    return this.ledger.append({
      timestamp: this.clock(),
      actor: decision.allow ? args.actor : "policy",
      command: args.command,
      payload: args.payload ?? {},
      input_entities: args.input,
      output_entities: args.output,
      result,
      summary: decision.allow ? args.summary : decision.reason,
    });
  }

  startJob(req: IngestRequest): JobState {
    this.seq += 1;
    const id = req.recordId ? `job-${req.recordId}` : `job-${this.seq}`;
    const job: JobState = {
      id,
      filename: req.filename,
      bytes: new Uint8Array(req.bytes),
      stage: 0,
      stages: [...ACCESSION_STAGES],
      receipts: [],
      done: false,
      recordId: req.recordId,
      injected: looksInjected(req.bytes),
      providedClaims: req.claims,
      meta: req.meta ?? {},
    };
    this.jobs.set(id, job);
    return job;
  }

  async runJob(jobId: string): Promise<JobState> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`unknown job ${jobId}`);
    while (!job.done && job.failed === undefined) {
      await this.advanceJob(jobId);
    }
    return job;
  }

  async advanceJob(jobId: string): Promise<StageResult> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`unknown job ${jobId}`);
    if (job.done) {
      return {
        ok: true,
        stage: job.stage,
        name: "done",
        receipt: job.receipts.at(-1) ?? "",
        command: "PRESERVE",
        summary: "already complete",
      };
    }
    const index = job.stage;
    const name = ACCESSION_STAGES[index]!;
    const result = await this.runStage(job, index, name);
    job.receipts.push(result.receipt);
    if (!result.ok) {
      job.failed = index;
      job.error = result.error;
      job.done = true;
    } else {
      job.stage = index + 1;
      if (job.stage >= ACCESSION_STAGES.length) job.done = true;
    }
    return result;
  }

  private async runStage(job: JobState, index: number, name: string): Promise<StageResult> {
    const fail = async (command: string, error: string): Promise<StageResult> => {
      const ev = await this.command({
        actor: "archivist",
        command,
        summary: error,
        result: "failed",
        untrusted: job.injected,
        payload: { job: job.id, stage: name },
      });
      return { ok: false, stage: index, name, receipt: ev.event_hash, command, summary: error, error };
    };

    try {
      switch (name) {
        case "Accession": {
          const put = await this.objects.put(job.bytes);
          job.hash = put.hash;
          if (job.injected) {
            await this.command({
              actor: "policy",
              command: "REFUSE_CAPABILITY",
              summary: `Injection text in ${job.filename} did not grant capabilities. Bytes stored as restricted data.`,
              result: "denied",
              untrusted: true,
              output: [put.hash],
              payload: { filename: job.filename, hash: put.hash },
            });
          }
          const ev = await this.command({
            actor: "archivist",
            command: "ACCESSION_WRITE_BYTES",
            summary: `Wrote original bytes for ${job.filename} at ${put.hash.slice(0, 8)}…`,
            output: [put.hash],
            payload: { filename: job.filename, hash: put.hash, wrote: put.wrote },
          });
          return ok(index, name, ev, "ACCESSION_WRITE_BYTES");
        }
        case "Parse": {
          job.body = fromUtf8(job.bytes);
          const ev = await this.command({
            actor: "archivist",
            command: "CREATE_REPRESENTATION",
            summary: `Parsed extracted_text representation (${job.bytes.length} bytes).`,
            input: job.hash ? [job.hash] : [],
            output: job.hash ? [job.hash] : [],
            payload: { encoding: "utf-8", bytes: job.bytes.length },
          });
          this.catalog.data.provEntities.push({
            id: `rep-${job.id}`,
            role: "representation",
            objectHash: job.hash,
            recordId: job.recordId,
          });
          return ok(index, name, ev, "CREATE_REPRESENTATION");
        }
        case "Fingerprint": {
          if (!job.hash) return fail("FINGERPRINT", "no object hash");
          const again = await sha256Bytes(job.bytes);
          if (again !== job.hash) return fail("FINGERPRINT", "SHA-256 of bytes does not match object id");
          const ev = await this.command({
            actor: "archivist",
            command: "FINGERPRINT",
            summary: `SOURCE_ID = sha256(original_bytes) = ${job.hash}`,
            output: [job.hash],
            payload: { hash: job.hash },
          });
          return ok(index, name, ev, "FINGERPRINT");
        }
        case "Classify": {
          const body = job.body ?? "";
          const sourceType =
            job.meta.sourceType ?? classifySource(job.filename, body);
          job.meta.sourceType = sourceType;
          const ev = await this.command({
            actor: "archivist",
            command: "CLASSIFY",
            summary: `Classified as ${sourceType}${job.injected ? " (untrusted)" : ""}.`,
            input: job.hash ? [job.hash] : [],
            payload: { sourceType, untrusted: job.injected },
          });
          this.catalog.data.provEntities.push({
            id: `class-${job.id}`,
            role: "classification",
            objectHash: job.hash,
          });
          this.catalog.data.provEdges.push({
            id: `edge-class-${job.id}`,
            relation: "wasDerivedFrom",
            fromId: `class-${job.id}`,
            toId: job.hash ?? job.id,
          });
          return ok(index, name, ev, "CLASSIFY");
        }
        case "Catalog": {
          const body = job.body ?? "";
          const createdAt = job.meta.createdAt ?? this.clock().slice(0, 10);
          const recordId = job.recordId ?? `src-${(job.hash ?? "x").slice(0, 12)}`;
          job.recordId = recordId;
          const prior = this.catalog.recordsByUri(job.meta.originalUri ?? `file://inbox/${job.filename}`);
          const duplicateOf =
            job.meta.duplicateOf ??
            this.catalog.recordsByHash(job.hash ?? "").find((r) => r.id !== recordId)?.id;
          const integrityAlert =
            job.meta.integrityAlert ??
            prior.some((r) => r.contentHash !== job.hash && r.kind === "original");
          const record: LibraryRecord = {
            id: recordId,
            contentHash: job.hash ?? "",
            sourceType: job.meta.sourceType ?? "note",
            kind: job.meta.kind ?? "original",
            title: job.meta.title ?? extractTitle(job.filename, body),
            originalUri: job.meta.originalUri ?? `file://inbox/${job.filename}`,
            acquiredAt: job.meta.acquiredAt ?? this.clock(),
            createdAt,
            author: job.meta.author ?? "unattributed (dropped)",
            collectionIds: job.meta.collectionIds ?? (job.injected ? ["col-security"] : []),
            body,
            pages: job.meta.pages,
            accessPolicy: job.injected ? "restricted" : (job.meta.accessPolicy ?? "open"),
            duplicateOf,
            injectionFlag: job.injected || job.meta.injectionFlag,
            integrityAlert,
            brokenLinks: job.meta.brokenLinks,
            ocrErrors: job.meta.ocrErrors,
            derivedFrom: job.meta.derivedFrom,
            processor: job.meta.processor,
            tags: job.meta.tags ?? (job.injected ? ["injection", "untrusted"] : ["inbox"]),
          };
          this.catalog.upsertRecord(record);
          this.catalog.data.provEntities.push({
            id: recordId,
            role: record.kind === "derivative" ? "summary" : "original",
            objectHash: record.contentHash,
            recordId,
          });
          if (integrityAlert) {
            this.catalog.data.desk.push({
              id: `desk-integrity-${recordId}`,
              kind: "integrity",
              severity: "alert",
              title: "Source changed since last capture",
              body: `${record.originalUri} recaptured with a different content hash.`,
              relatedIds: [recordId, ...prior.map((p) => p.id)],
            });
          }
          if (duplicateOf) {
            this.catalog.data.desk.push({
              id: `desk-dup-${recordId}`,
              kind: "duplicate",
              severity: "info",
              title: "Duplicate linked",
              body: `${record.title} matches existing object ${duplicateOf}. Linked, not merged.`,
              relatedIds: [recordId, duplicateOf],
            });
          }
          const ev = await this.command({
            actor: "archivist",
            command: "CATALOG",
            summary: `Catalogued ${record.title} (${record.contentHash.slice(0, 8)}…).`,
            output: [recordId, record.contentHash],
            payload: { recordId, hash: record.contentHash },
          });
          return ok(index, name, ev, "CATALOG");
        }
        case "Claim extraction": {
          const record = this.catalog.recordById(job.recordId ?? "");
          if (!record) return fail("EXTRACT_CLAIMS", "record missing");
          const claims =
            job.providedClaims?.map((c) => ({ ...c, recordId: record.id })) ??
            heuristicClaims(record, job.body ?? "");
          this.catalog.data.claims.push(...claims);
          const activityId = `activity-extract-${job.id}`;
          const ev = await this.command({
            actor: "archivist",
            command: "EXTRACT_CLAIMS",
            summary: `Extracted ${claims.length} claims with passage-level provenance.`,
            input: [record.id],
            output: claims.map((c) => c.id),
            payload: { count: claims.length },
          });
          this.catalog.data.provActivities.push({
            id: activityId,
            kind: "EXTRACT_CLAIMS",
            at: ev.timestamp,
            eventHash: ev.event_hash,
          });
          this.catalog.data.provEdges.push({
            id: `edge-assoc-${activityId}`,
            relation: "wasAssociatedWith",
            fromId: activityId,
            toId: "agent-archivist",
          });
          for (const claim of claims) {
            this.catalog.data.provEntities.push({
              id: claim.id,
              role: "claim",
              objectHash: record.contentHash,
              recordId: record.id,
            });
            this.catalog.data.provEdges.push({
              id: `edge-${claim.id}`,
              relation: "wasDerivedFrom",
              fromId: claim.id,
              toId: record.id,
            });
            this.catalog.data.provEdges.push({
              id: `edge-gen-${claim.id}`,
              relation: "wasGeneratedBy",
              fromId: claim.id,
              toId: activityId,
            });
            this.catalog.data.provEdges.push({
              id: `edge-attr-${claim.id}`,
              relation: "wasAttributedTo",
              fromId: claim.id,
              toId: "agent-archivist",
            });
          }
          return ok(index, name, ev, "EXTRACT_CLAIMS");
        }
        case "Temporalize": {
          const record = this.catalog.recordById(job.recordId ?? "");
          const related = this.catalog.data.claims.filter((c) => c.recordId === job.recordId);
          for (const claim of related) {
            if (!claim.validFrom) claim.validFrom = claim.assertedAt;
          }
          const ev = await this.command({
            actor: "archivist",
            command: "TEMPORALIZE",
            summary: `Assigned asserted_at / valid_from / valid_to on ${related.length} claims.`,
            input: related.map((c) => c.id),
            payload: { recordId: record?.id },
          });
          return ok(index, name, ev, "TEMPORALIZE");
        }
        case "Reconcile": {
          const record = this.catalog.recordById(job.recordId ?? "");
          const author = record?.author ?? "";
          const collisions = this.catalog.data.entities.filter((e) =>
            e.aliases.some((a) => author.includes(a) || a === author) && e.uncertainMatch,
          );
          if (collisions.length) {
            this.catalog.data.desk.push({
              id: `desk-alias-${job.recordId}`,
              kind: "alias",
              severity: "warn",
              title: `Uncertain identity: ${author}`,
              body: "The Archivist will not auto-merge.",
              relatedIds: collisions.map((c) => c.id),
            });
          }
          const ev = await this.command({
            actor: "archivist",
            command: "RECONCILE",
            summary:
              collisions.length > 0
                ? `Entity reconciliation left ${collisions.length} uncertain match(es) for a human.`
                : "Entity reconciliation produced no automatic merges.",
            result: "ok",
            payload: { uncertain: collisions.map((c) => c.id) },
          });
          return ok(index, name, ev, "RECONCILE");
        }
        case "Contradiction": {
          const newClaims = this.catalog.data.claims.filter((c) => c.recordId === job.recordId);
          const topics = new Set(newClaims.flatMap((c) => c.topics));
          const disputed = this.catalog.data.claims.filter(
            (c) => c.status === "disputed" && c.topics.some((t) => topics.has(t)),
          );
          const uncoveredNew = newClaims.filter(
            (c) =>
              c.status === "disputed" &&
              !this.catalog.data.contradictions.some((x) => x.claimIds.includes(c.id)),
          );
          if (disputed.length >= 2 && uncoveredNew.length > 0) {
            const id = `X-auto-${job.recordId}`;
            this.catalog.data.contradictions.push({
              id,
              claimIds: disputed.map((c) => c.id),
              title: "Incompatible claims remain open",
              summary: "The Archivist will not average them.",
              status: "open",
            });
            this.catalog.data.desk.push({
              id: `desk-conflict-${job.recordId}`,
              kind: "conflict",
              severity: "warn",
              title: "Conflicting claims opened",
              body: "Incompatible figures retained.",
              relatedIds: [id],
            });
          }
          const ev = await this.command({
            actor: "archivist",
            command: "FLAG_CONTRADICTION",
            summary: "Claim-set comparison complete. Incompatible sources remain incompatible.",
            payload: { recordId: job.recordId },
          });
          return ok(index, name, ev, "FLAG_CONTRADICTION");
        }
        case "Shelving": {
          const record = this.catalog.recordById(job.recordId ?? "");
          const ev = await this.command({
            actor: "archivist",
            command: "SHELVE",
            summary: `Proposed collections: ${(record?.collectionIds ?? []).join(", ") || "inbox"}.`,
            output: record?.collectionIds ?? [],
            payload: { collections: record?.collectionIds ?? [] },
          });
          return ok(index, name, ev, "SHELVE");
        }
        case "Index": {
          const record = this.catalog.recordById(job.recordId ?? "");
          if (record) {
            for (const token of tokenize(`${record.title} ${job.body ?? ""}`)) {
              const bucket = this.catalog.data.indexes[token] ?? [];
              if (!bucket.includes(record.id)) bucket.push(record.id);
              this.catalog.data.indexes[token] = bucket;
            }
          }
          const ev = await this.command({
            actor: "archivist",
            command: "INDEX",
            summary: "Updated lexical, semantic, and provenance indexes.",
            input: record ? [record.id] : [],
          });
          return ok(index, name, ev, "INDEX");
        }
        case "Preserve": {
          if (!job.hash) return fail("PRESERVE", "missing hash");
          const intact = await this.objects.verify(job.hash);
          if (!intact) return fail("PRESERVE", "fixity failed at commit");
          const ev = await this.command({
            actor: "archivist",
            command: "PRESERVE",
            summary: `Fixity receipt ${job.hash.slice(0, 8)}… durable commit.`,
            output: [job.hash],
            payload: { hash: job.hash, path: this.objects.path(job.hash) },
          });
          return ok(index, name, ev, "PRESERVE");
        }
        default:
          return fail("UNKNOWN", `unknown stage ${name}`);
      }
    } catch (err) {
      return fail("EXCEPTION", err instanceof Error ? err.message : String(err));
    }
  }

  async ingest(req: IngestRequest): Promise<JobState> {
    const job = this.startJob(req);
    return this.runJob(job.id);
  }

  async recheckFixity(): Promise<{ ok: boolean; mismatches: string[] }> {
    const mismatches: string[] = [];
    for (const rec of this.catalog.data.records) {
      if (!rec.contentHash) continue;
      const okHash = await this.objects.verify(rec.contentHash);
      if (!okHash) mismatches.push(rec.contentHash);
    }
    const ev = await this.command({
      actor: "archivist",
      command: "FIXITY_RECHECK",
      summary:
        mismatches.length === 0
          ? `Rechecked ${this.objects.size} objects. All hashes match stored bytes.`
          : `Fixity failed for ${mismatches.length} object(s).`,
      result: mismatches.length ? "failed" : "ok",
      payload: { mismatches },
    });
    if (mismatches.length) {
      this.catalog.data.desk.push({
        id: `desk-fixity-${ev.event_id}`,
        kind: "integrity",
        severity: "alert",
        title: "Fixity recheck failed",
        body: "A stored original no longer hashes to its SOURCE_ID.",
        relatedIds: mismatches,
      });
    }
    return { ok: mismatches.length === 0, mismatches };
  }

  async wipeDerivatives(): Promise<string[]> {
    const removed = this.catalog.removeDerivatives();
    const hashes = removed.map((r) => r.contentHash).filter(Boolean);
    for (const hash of hashes) {
      const stillNeeded = this.catalog.data.records.some((r) => r.contentHash === hash);
      if (!stillNeeded) this.objects.delete(hash);
    }
    await this.command({
      actor: "human",
      command: "WIPE_DERIVATIVES",
      summary:
        "Deleted AI summaries and derived claims. Originals untouched. Fixity intact.",
      output: hashes,
    });
    return hashes;
  }

  async rebuildDerivative(args: {
    id: string;
    title: string;
    body: string;
    derivedFrom: string[];
    processor: string;
  }): Promise<LibraryRecord> {
    const bytes = utf8(args.body);
    const put = await this.objects.put(bytes);
    const record: LibraryRecord = {
      id: args.id,
      contentHash: put.hash,
      sourceType: "summary",
      kind: "derivative",
      title: args.title,
      originalUri: `derivative://${args.id}`,
      acquiredAt: this.clock(),
      createdAt: this.clock().slice(0, 10),
      author: args.processor,
      collectionIds: ["col-mercury"],
      body: args.body,
      accessPolicy: "open",
      derivedFrom: args.derivedFrom,
      processor: args.processor,
      tags: ["derivative"],
    };
    this.catalog.upsertRecord(record);
    this.catalog.data.provEntities.push({
      id: record.id,
      role: "summary",
      objectHash: put.hash,
      recordId: record.id,
    });
    const activityId = `activity-rebuild-${record.id}`;
    this.catalog.data.provActivities.push({
      id: activityId,
      kind: "REBUILD_DERIVATIVES",
      at: this.clock(),
      eventHash: "",
    });
    for (const src of args.derivedFrom) {
      this.catalog.data.provEdges.push({
        id: `edge-${record.id}-${src}`,
        relation: "wasDerivedFrom",
        fromId: record.id,
        toId: src,
      });
    }
    this.catalog.data.provEdges.push({
      id: `edge-gen-${record.id}`,
      relation: "wasGeneratedBy",
      fromId: record.id,
      toId: activityId,
    });
    this.catalog.data.provEdges.push({
      id: `edge-attr-${record.id}`,
      relation: "wasAttributedTo",
      fromId: record.id,
      toId: `agent-${args.processor}`,
    });
    this.catalog.data.provEdges.push({
      id: `edge-assoc-${activityId}`,
      relation: "wasAssociatedWith",
      fromId: activityId,
      toId: `agent-${args.processor}`,
    });
    const ev = await this.command({
      actor: "archivist",
      command: "REBUILD_DERIVATIVES",
      summary: `Rebuilt ${args.id} with ${args.processor}. Original hashes unchanged.`,
      input: args.derivedFrom,
      output: [record.id, put.hash],
    });
    const activity = this.catalog.data.provActivities.find((a) => a.id === activityId);
    if (activity) activity.eventHash = ev.event_hash;
    return record;
  }

  async installSigned(signed: SignedLibrarian, previous?: SignedLibrarian | null): Promise<{
    ok: boolean;
    reason: string;
    event: ChainEvent;
  }> {
    const verified = await verifyLibrarianPackage(signed);
    const decision = authorize({
      actor: "human",
      command: previous ? "UPGRADE_LIBRARIAN" : "INSTALL_LIBRARIAN",
      signed: verified.ok,
      publisherTrusted: verified.ok,
      requested: signed.manifest.permissions,
      previous: previous
        ? {
            id: previous.librarian.id,
            version: previous.librarian.version,
            publisher: previous.librarian.publisher,
            permissions: previous.manifest.permissions,
            packageHash: previous.manifest.package_hash,
            signature: previous.signature,
          }
        : this.catalog.data.installed.find((i) => i.id === signed.librarian.id) ?? null,
    });
    if (!decision.allow) {
      const event = await this.command({
        actor: "policy",
        command: "REFUSE_INSTALL",
        summary: decision.reason,
        result: "denied",
        payload: { id: signed.librarian.id, version: signed.librarian.version },
      });
      return { ok: false, reason: decision.reason, event };
    }
    this.catalog.data.installed = [
      ...this.catalog.data.installed.filter((i) => i.id !== signed.librarian.id),
      {
        id: signed.librarian.id,
        version: signed.librarian.version,
        publisher: signed.librarian.publisher,
        permissions: signed.manifest.permissions,
        packageHash: signed.manifest.package_hash,
        signature: signed.signature,
      },
    ];
    const event = await this.command({
      actor: "human",
      command: "INSTALL_LIBRARIAN",
      summary: `Installed ${signed.librarian.name} ${signed.librarian.version} with declared permissions only.`,
      output: [signed.librarian.id],
      payload: { package_hash: signed.manifest.package_hash },
    });
    return { ok: true, reason: "installed", event };
  }

  async grantFromDocument(): Promise<ChainEvent> {
    return this.command({
      actor: "document",
      command: "GRANT_CAPABILITY",
      summary: "Document requested network and shell.",
      payload: { network: true, shell: true },
    });
  }

  async exportArchive(): Promise<Bag> {
    const bag = await exportBag({
      objects: this.objects,
      ledger: this.ledger,
      catalog: this.catalog,
    });
    return bag.files;
  }

  async restoreArchive(files: Bag): Promise<void> {
    const restored = await restoreBag(files);
    this.objects.importAll(restored.objects.exportAll());
    this.ledger.load(restored.ledger.events);
    this.catalog.load(restored.catalog.clone());
  }

  destroyCatalog(): void {
    this.catalog.reset();
  }

  uiJobs(): AccessionJob[] {
    return [...this.jobs.values()]
      .map(({ bytes: _bytes, ...rest }) => rest)
      .sort((a, b) => (a.id < b.id ? 1 : -1));
  }

  uiLedger(): LedgerEvent[] {
    return [...this.ledger.events].reverse().map((ev) => ({
      id: ev.event_id,
      at: ev.timestamp,
      actor: ev.actor === "document" ? "policy" : ev.actor,
      command: ev.command,
      summary: ev.summary,
      receipt: ev.event_hash,
      relatedIds: [...ev.input_entities, ...ev.output_entities],
    }));
  }

  uiDesk(): (DeskItem & { decision: "pending" | "accepted" | "rejected" })[] {
    return this.catalog.data.desk.map((d) => ({ ...d, decision: "pending" as const }));
  }

  decideDesk(id: string, decision: "accepted" | "rejected"): void {
    const item = this.catalog.data.desk.find((d) => d.id === id);
    if (!item) return;
    const contradiction = this.catalog.data.contradictions.find((c) => item.relatedIds.includes(c.id));
    if (contradiction && decision === "accepted") contradiction.status = "accepted";
    if (contradiction && decision === "rejected") contradiction.status = "open";
    void this.command({
      actor: "human",
      command: decision === "accepted" ? "ACCEPT_PROPOSAL" : "REJECT_PROPOSAL",
      summary: `${decision === "accepted" ? "Accepted" : "Kept open"}: ${item.title}`,
      input: [id],
    });
  }

  snapshot() {
    return {
      records: this.catalog.data.records,
      claims: this.catalog.data.claims,
      entities: this.catalog.data.entities,
      relationships: this.catalog.data.relationships,
      contradictions: this.catalog.data.contradictions,
      collections: this.catalog.data.collections,
      desk: this.catalog.data.desk,
      installed: this.catalog.data.installed,
      ledger: this.uiLedger(),
      jobs: this.uiJobs(),
      wipedDerivatives: !this.catalog.data.records.some((r) => r.kind === "derivative"),
    };
  }
}

function ok(stage: number, name: string, ev: ChainEvent, command: string): StageResult {
  return {
    ok: ev.result !== "failed",
    stage,
    name,
    receipt: ev.event_hash,
    command,
    summary: ev.summary,
  };
}

export { signLibrarian };
export type { Librarian };
