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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
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
await page.screenshot({ path: "/workspace/screenshots/dots-chamber.png", fullPage: true });

const promote = page.getByRole("button", { name: "Promote to fact" });
if ((await promote.count()) > 0) {
  await promote.first().click();
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "/workspace/screenshots/dots-promote.png", fullPage: true });

await page.getByRole("link", { name: /^Ledger\b/ }).first().click();
await page.getByRole("heading", { name: "Commands, then receipts." }).waitFor();
const ledger = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/dots-ledger.png", fullPage: true });

await page.getByRole("link", { name: /^Ask\b/ }).first().click();
await page.getByRole("heading", { name: "Investigate, do not chat." }).waitFor();
const ask = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/dots-ask.png", fullPage: true });

const checks = {
  hypothesis: /HYPOTHESIS/i.test(await page.locator("body").innerText()) || /HYPOTHESIS/i.test(ledger),
  connect: /CONNECT/.test(ledger),
  far: /FAR/.test(ledger) || /FAR/.test(ask),
  noTruth: !/\btruth\s*=\s*true/i.test(ledger),
  discovery: /Discovery receipts/i.test(ledger) || /CONNECT/.test(ledger),
};
const chamberText = "";
console.log(
  JSON.stringify(
    {
      ok: Object.values(checks).every(Boolean) && errors.length === 0,
      checks,
      errors,
      ledgerSnippet: ledger.slice(0, 800),
    },
    null,
    2,
  ),
);
await browser.close();
process.exit(Object.values(checks).every(Boolean) && errors.length === 0 ? 0 : 1);
