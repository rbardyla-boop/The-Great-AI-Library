#!/usr/bin/env node
/**
 * READING-ROOM SHELL — live Playwright gate.
 * Semantic rooms + notice-must-not-obstruct-nav. Does not edit the shell.
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";

const CANONICAL_LABELS = [
  "Stacks",
  "Ask",
  "Chamber",
  "Desk",
  "Inbox",
  "Exchange",
  "VALUES",
  "Ledger",
  "Constitution",
];

const MOBILE_LABELS = ["Stacks", "Ask", "Chamber", "Inbox", "Exchange"];

function boxesOverlap(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

async function enterLibrary(page) {
  await page.getByRole("button", { name: "Enter the Reading Room" }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Enter the Reading Room" }).click();
  await page.getByRole("heading", { name: "Preserved sources" }).waitFor({ timeout: 45000 });
}

export async function previewUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function runShellGate(opts = {}) {
  const url = checkedUrl(opts.url ?? process.env.SHELL_GATE_URL ?? "http://127.0.0.1:8080/");
  const shotDir = opts.shotDir ?? join(dirname(fileURLToPath(import.meta.url)), "../screenshots");
  mkdirSync(shotDir, { recursive: true });
  const desktopPng = checkedOutputPath(join(shotDir, "shell-gate.png"), ["/workspace"]);
  const mobilePng = checkedOutputPath(join(shotDir, "shell-gate-mobile.png"), ["/workspace"]);
  const reasons = [];

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await desktop.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await enterLibrary(desktop);

    for (const label of CANONICAL_LABELS) {
      const loc = desktop.getByRole("link", { name: new RegExp(`^${label}\\b`) });
      if ((await loc.count()) === 0) reasons.push(`desktop missing room: ${label}`);
    }

    const aside = desktop.locator("aside").first();
    const keep = desktop.getByRole("button", { name: "Keep it here" });
    if ((await keep.count()) > 0 && (await aside.isVisible())) {
      const a = await aside.boundingBox();
      const n = await keep.boundingBox();
      if (boxesOverlap(a, n)) reasons.push("local-store notice overlaps desktop sidebar");
    }
    await desktop.screenshot({ path: desktopPng, fullPage: false });
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await enterLibrary(mobile);

    const bottomNav = mobile.locator("nav").last();
    for (const label of MOBILE_LABELS) {
      const loc = bottomNav.getByRole("link", { name: label });
      if ((await loc.count()) === 0) reasons.push(`mobile missing room: ${label}`);
    }
    const keepM = mobile.getByRole("button", { name: "Keep it here" });
    if ((await keepM.count()) > 0) {
      const n = await keepM.boundingBox();
      const navBox = await bottomNav.boundingBox();
      if (boxesOverlap(n, navBox)) reasons.push("local-store notice overlaps mobile navigation");
    }
    await mobile.screenshot({ path: mobilePng, fullPage: false });
    await mobile.close();
  } finally {
    await browser.close();
  }

  return {
    ok: reasons.length === 0,
    reasons,
    screenshots: { desktop: desktopPng, mobile: mobilePng },
  };
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  const verdict = await runShellGate();
  console.log(JSON.stringify(verdict, null, 2));
  process.exit(verdict.ok ? 0 : 1);
}
