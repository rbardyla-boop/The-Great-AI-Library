#!/usr/bin/env node
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto("http://127.0.0.1:8080/library", { waitUntil: "domcontentloaded" });
const enter = page.getByRole("button", { name: "Enter the Reading Room" });
if (await enter.count()) {
  await enter.waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  await enter.click();
}
await page.goto("http://127.0.0.1:8080/library", { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Library", exact: true }).waitFor({ timeout: 20000 });
await page.getByLabel("Library query").fill("Did Project Mercury overrun its budget?");
await page.getByRole("button", { name: "Retrieve" }).click();
await page.getByText("Observed source").waitFor({ timeout: 20000 });
await page.getByText(/No server key|Judgment was not invented|SERVICE UNAVAILABLE|service unavailable/i).first().waitFor({ timeout: 20000 });
const text = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/library-cognitive.png", fullPage: true });
const checks = {
  observed: /OBSERVED SOURCE/i.test(text),
  judgment: /MODEL JUDGMENT/i.test(text),
  policy: /POLICY DISPOSITION/i.test(text),
  noKey: /No server key|not invented|SERVICE UNAVAILABLE/i.test(text),
  source: /Helios|Mercury|budget/i.test(text),
  noTruth: !/\btruth\s*=\s*true/i.test(text),
};
console.log(JSON.stringify({ ok: Object.values(checks).every(Boolean) && errors.length === 0, checks, errors, snippet: text.slice(0, 700) }, null, 2));
await browser.close();
process.exit(Object.values(checks).every(Boolean) && errors.length === 0 ? 0 : 1);
