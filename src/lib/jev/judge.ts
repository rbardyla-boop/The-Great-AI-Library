import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { packetFromAttempt } from "../cognitive/adapter.ts";
import { judgeLibrary } from "./client.ts";
import { publicReceipt } from "./receipts.ts";
import type { JudgeInput } from "./types.ts";

const Passage = z.object({
  recordId: z.string().max(80),
  claimId: z.string().max(80),
  title: z.string().max(200),
  hash: z.string().max(80),
  passage: z.string().max(800),
});

const Input = z.object({
  query: z.string().min(1).max(500),
  passages: z.array(Passage).max(6),
});

export const judgeGal = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const attempt = await judgeLibrary(data as JudgeInput, {
      apiKey: process.env.TYPESAFE_API_KEY?.trim() || undefined,
      fetch: globalThis.fetch,
    });
    const hashes = data.passages.map((p) => p.hash);
    const decision = packetFromAttempt(attempt, {
      sourceHashes: hashes,
      recordIds: data.passages.map((p) => p.recordId),
      liveHashes: hashes,
    });
    return {
      receipt: publicReceipt(attempt),
      packet: decision.packet,
      mutated: false as const,
      promoted: false as const,
    };
  });
