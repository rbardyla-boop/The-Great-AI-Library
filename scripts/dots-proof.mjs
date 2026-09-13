#!/usr/bin/env node
import { chromium } from "playwright";

async function enter(page) {
  await page.getByRole("button", { name: "Enter the Reading Room" }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Enter the Reading Room" }).click();
  await page.getByRole("heading", { name: "Preserved sources" }).waitFor({ timeout: 45000 });
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  permissions: ["clipboard-read", "clipboard-write"],
  viewport: { width: 1280, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await enter(page);

await page.getByRole("link", { name: /^Chamber\b/ }).first().click();
await page.getByRole("heading", { name: "Same mind. Different law." }).waitFor();
await page.getByRole("button", { name: "Run Connect-the-Dots" }).click();
await page.getByText("HYPOTHESIS — NOT LIBRARY FACT").first().waitFor({ timeout: 20000 });
await page.getByText("gal://connection/sha256:").first().waitFor({ timeout: 10000 });
await page.screenshot({ path: "/workspace/screenshots/dots-chamber.png", fullPage: true });

const promote = page.getByRole("button", { name: "Promote to fact" });
if ((await promote.count()) > 0) {
  await promote.first().click();
  await page.waitForTimeout(400);
}
const afterPromote = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/dots-promote.png", fullPage: true });

const supportBtn = page.getByRole("button", { name: "File opinion" });
if ((await supportBtn.count()) > 0) {
  await supportBtn.first().click();
  await page.waitForTimeout(300);
}
const evidenceBtn = page.getByRole("button", { name: "File evidence" });
if ((await evidenceBtn.count()) > 0) {
  await evidenceBtn.first().click();
  await page.waitForTimeout(300);
}

const exportBtn = page.getByRole("button", { name: "Export envelope" });
let envelope = "";
if ((await exportBtn.count()) > 0) {
  await exportBtn.first().click();
  await page.waitForTimeout(400);
  try {
    envelope = await page.evaluate(() => navigator.clipboard.readText());
  } catch {
    envelope = "";
  }
}

const challenge = page.getByRole("button", { name: "Skeptic challenge" });
if ((await challenge.count()) > 0) {
  await challenge.first().click();
  await page.waitForTimeout(400);
}
const afterChallenge = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/dots-challenge.png", fullPage: true });

if (envelope && envelope.includes("gal-dots/1")) {
  await page.locator("textarea").first().fill(envelope);
  await page.getByRole("button", { name: "Import object" }).click();
  await page.waitForTimeout(500);
}

let reviewEnvelope = "";
const exportReview = page.getByRole("button", { name: "Export review" });
if ((await exportReview.count()) > 0) {
  await exportReview.first().click();
  await page.waitForTimeout(400);
  try {
    reviewEnvelope = await page.evaluate(() => navigator.clipboard.readText());
  } catch {
    reviewEnvelope = "";
  }
}
if (reviewEnvelope && reviewEnvelope.includes("gal-dots/2")) {
  await page.locator("textarea").first().fill(reviewEnvelope);
  await page.getByRole("button", { name: "Import object" }).click();
  await page.waitForTimeout(500);
}

await page.getByRole("link", { name: /^Ledger\b/ }).first().click();
await page.getByRole("heading", { name: "Commands, then receipts." }).waitFor();
const ledger = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/dots-ledger.png", fullPage: true });

await page.getByRole("link", { name: /^Ask\b/ }).first().click();
await page.getByRole("heading", { name: "Investigate, do not chat." }).waitFor();
const ask = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/dots-ask.png", fullPage: true });

const checks = {
  hypothesis: /HYPOTHESIS/i.test(afterPromote) || /HYPOTHESIS/i.test(ledger),
  connect: /CONNECT/.test(ledger),
  galUri: /gal:\/\/connection\/sha256:[0-9a-f]{16,}/i.test(afterPromote) || /gal:\/\/connection\/sha256:/i.test(ledger),
  scoreNotEvidence: /score is not evidence/i.test(afterPromote) || /opinion is not evidence/i.test(afterPromote),
  far: /FAR/.test(ledger) || /FAR/.test(ask),
  noTruth: !/\btruth\s*=\s*true/i.test(ledger),
  discovery: /Discovery receipts/i.test(ledger) || /CONNECT/.test(ledger),
  artifactSealed: /artifact\s+HYPOTHESIS/i.test(afterChallenge),
  supportFiled: /SUPPORT/.test(ledger) || /OPINION/i.test(afterChallenge),
  challengeCites: /CHALLENGE/.test(ledger) && /gal:\/\/connection\/sha256:/i.test(ledger),
  replicate: !envelope || /REPLICATE/.test(ledger) || /IMPORT_REVIEW/.test(ledger),
  envelope: !envelope || /"protocol":"gal-dots\/1"/.test(envelope.replace(/\s/g, "")),
  reviewUri: /gal:\/\/review\/sha256:/i.test(afterChallenge) || /gal:\/\/review\/sha256:/i.test(ledger),
  opinionZero: /contribution 0/i.test(afterChallenge) || /OPINION/i.test(ledger),
  policy: /Conservative policy/i.test(afterPromote) || /conservative/i.test(ledger),
};
console.log(
  JSON.stringify(
    {
      ok: Object.values(checks).every(Boolean) && errors.length === 0,
      checks,
      errors,
      envelopeBytes: envelope.length,
      ledgerSnippet: ledger.slice(0, 900),
    },
    null,
    2,
  ),
);
await browser.close();
process.exit(Object.values(checks).every(Boolean) && errors.length === 0 ? 0 : 1);
