import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatGauntlet, runGauntlet } from "./gauntlet.ts";

describe("GAL gauntlet", () => {
  it("all twelve gates pass", async () => {
    const results = await runGauntlet();
    const report = await formatGauntlet(results);
    const failed = results.filter((r) => !r.pass);
    assert.equal(failed.length, 0, report + "\n" + failed.map((f) => `${f.name}: ${f.detail}`).join("\n"));
    assert.match(report, /12 \/ 12/);
    assert.match(report, /THE LIBRARY REMEMBERS WITHOUT LYING/);
  });
});
