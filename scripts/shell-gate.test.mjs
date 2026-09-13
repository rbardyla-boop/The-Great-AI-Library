import assert from "node:assert/strict";
import { test } from "node:test";
import { previewUp, runShellGate } from "./shell-gate.mjs";

test("READING-ROOM SHELL live gate", async (t) => {
  if (process.env.SHELL_GATE === "0") {
    t.skip("SHELL_GATE=0");
    return;
  }
  const url = process.env.SHELL_GATE_URL ?? "http://127.0.0.1:8080/";
  if (!(await previewUp(url))) {
    t.skip("preview is not running; source invariant still gates the shell");
    return;
  }
  const verdict = await runShellGate({ url });
  assert.equal(verdict.ok, true, verdict.reasons.join("\n") || "shell gate failed");
});
