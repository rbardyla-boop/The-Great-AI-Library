import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { CANONICAL_ROOMS, MOBILE_ROOMS, SHELL_INVARIANT } from "./rooms.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const shell = readFileSync(join(root, "components/shell/app-shell.tsx"), "utf8");
const notice = readFileSync(join(root, "components/shell/store-notice.tsx"), "utf8");

describe("READING-ROOM SHELL", () => {
  it("canonical rooms are present in the frozen shell", () => {
    for (const room of CANONICAL_ROOMS) {
      assert.ok(shell.includes(`"${room.to}"`), `missing path ${room.to}`);
      assert.ok(shell.includes(room.label), `missing label ${room.label}`);
    }
    for (const label of MOBILE_ROOMS) {
      assert.match(shell, new RegExp(`label: "${label}"`));
    }
  });

  it("local-store notice sits inside main and is not a fixed overlay", () => {
    assert.match(shell, /<main[\s\S]*<StoreNotice \/>/);
    assert.doesNotMatch(notice, /\bfixed\b/);
    assert.doesNotMatch(notice, /inset-x-0/);
    assert.doesNotMatch(notice, /bottom-0/);
  });

  it("names the invariant so a baseline change is explicit", () => {
    assert.match(SHELL_INVARIANT, /canonical room/);
    assert.match(SHELL_INVARIANT, /baseline/);
  });
});
