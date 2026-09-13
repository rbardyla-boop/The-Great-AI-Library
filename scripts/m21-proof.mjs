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

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 20000 });
await enter(page);

await page.getByRole("link", { name: /^Chamber\b/ }).first().click();
await page.getByRole("heading", { name: "Same mind. Different law." }).waitFor();
await page.getByRole("button", { name: "Run MOTIVE-0" }).click();
await page.getByText("request-exception").first().waitFor({ timeout: 20000 });
await page.getByText("costly").first().waitFor();
await page.screenshot({ path: "/workspace/screenshots/m21-chamber-experiment.png", fullPage: true });

await page.getByRole("button", { name: "Replay under 1.4.0" }).click();
await page.getByText(/Replay under 1\.4\.0 →/).waitFor({ timeout: 20000 });
await page.getByText("Decision receipts").waitFor();
await page.screenshot({ path: "/workspace/screenshots/m21-chamber-replay.png", fullPage: true });
const chamberText = await page.locator("body").innerText();

await page.getByRole("link", { name: /^VALUES\b/ }).first().click();
await page.getByRole("heading", { name: "Judgment, not authority." }).waitFor();
await page.getByText("CAS verified").first().waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Propose amendment" }).click();
await page.getByText("recorded as proposed").waitFor({ timeout: 10000 });
await page.screenshot({ path: "/workspace/screenshots/m21-values.png", fullPage: true });
const valuesText = await page.locator("body").innerText();

await page.getByRole("link", { name: /^Ledger\b/ }).first().click();
await page.getByRole("heading", { name: "Commands, then receipts." }).waitFor();
await page.getByText("VALUES receipts").waitFor();
await page.waitForTimeout(500);
const ledgerText = await page.locator("body").innerText();
await page.screenshot({ path: "/workspace/screenshots/m21-ledger.png", fullPage: true });

const checks = {
  experimentTable: /request-exception/.test(chamberText) && /wasted-privilege/.test(chamberText),
  replayCites: /Original JUDGE/.test(chamberText) && /REPLAY /.test(chamberText),
  receipts: /Decision receipts/.test(chamberText) && /builder@1\.3\.0/.test(chamberText),
  cas: /CAS verified/i.test(valuesText),
  amendmentUi: /recorded as proposed/.test(valuesText),
  judge: ledgerText.includes("JUDGE"),
  experiment: ledgerText.includes("MOTIVE_EXPERIMENT"),
  seats: /Seat matrix|30 seats/.test(ledgerText),
  replayCmd: /\bREPLAY\b/.test(ledgerText),
  amendmentCmd: ledgerText.includes("AMENDMENT_PROPOSED"),
  evaluator: ledgerText.includes("gal-values-eval"),
};
const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
console.log(
  JSON.stringify(
    {
      ok: missing.length === 0 && errors.length === 0,
      missing,
      errors,
      ledgerSnippet: ledgerText.split("VALUES receipts")[1]?.slice(0, 800) ?? "",
      replaySnippet: chamberText.match(/Builder 1\.3\.0[\s\S]{0,400}/)?.[0] ?? "",
    },
    null,
    2,
  ),
);
await browser.close();
process.exit(missing.length === 0 && errors.length === 0 ? 0 : 1);
