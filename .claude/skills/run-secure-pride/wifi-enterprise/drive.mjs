// Wi-Fi Enterprise guide — browser driver (27 checks: flow, focus, storage,
// export, mobile layout, axe WCAG 2.1 AA, no network requests).
//
// Run from the repo root:
//   npm run build
//   npm i --no-save playwright axe-core && npx playwright install chromium
//   node .claude/skills/run-secure-pride/wifi-enterprise/serve.mjs dist 4400 &
//   node .claude/skills/run-secure-pride/wifi-enterprise/drive.mjs http://127.0.0.1:4400
// Screenshots land in ./shots/ next to this file.
// Drives /tools/wifi-enterprise end to end. Prints PASS/FAIL lines.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://127.0.0.1:4400";
const SHOTS = new URL("./shots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const AXE = readFileSync(new URL("../../../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
const requests = [];
page.on("request", (r) => requests.push(r.url()));

async function axe(label) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] }));
  const v = r.violations.map((x) => `${x.id}(${x.nodes.length})`);
  check(`axe WCAG 2.1 AA — ${label}`, v.length === 0, v.join(", "));
}

await page.goto(`${BASE}/tools/wifi-enterprise/`);
await page.getByRole("heading", { level: 1 }).waitFor();
await page.screenshot({ path: SHOTS + "01-intake.png", fullPage: true });
await axe("intake");

// Empty submit → alert + focus on first question
await page.getByRole("button", { name: "Show my path" }).click();
const alert = page.getByRole("alert");
check("empty submit shows alert", await alert.isVisible(), await alert.textContent());
check("focus moves to first unanswered input", await page.evaluate(() => document.activeElement?.id) === "accessPoints-unifi");
await page.screenshot({ path: SHOTS + "02-intake-missing.png" });

// Manual path, remote RADIUS, Apple + Android, personal devices
for (const id of ["accessPoints-unifi", "maintainer-yes", "radiusHost-remote", "mdm-no", "platforms-apple", "platforms-android", "personalDevices-yes"]) {
  await page.locator(`#${id}`).check();
}
check("counter reads 6 of 6", (await page.locator("#intake-count").textContent()).startsWith("6 of 6"));
await page.getByRole("button", { name: "Show my path" }).click();
await page.locator("#path-title").waitFor();
check("path is manual", (await page.locator("#path-title").textContent()) === "Enterprise Wi-Fi, installed by hand");
check("focus moves to path heading", await page.evaluate(() => document.activeElement?.id) === "path-title");
const navItems = await page.getByRole("navigation", { name: "Guide stages" }).getByRole("button").allTextContents();
check("tunnel stage present for remote server", navItems.some((t) => t.includes("off-site")), `${navItems.length} stages`);
check("hardening stage absent", !navItems.some((t) => t.includes("current Wi-Fi")));
await page.screenshot({ path: SHOTS + "03-path-desktop.png", fullPage: true });
await axe("guide stage 1");

// Toggle a step → announcement + progress text
const first = page.locator('input[id^="done-"]').first();
await first.check();
await page.waitForTimeout(100);
const live = await page.locator('[aria-live="polite"]').textContent();
check("toggle announced", /Marked done: .+\. 1 of \d+ steps complete\./.test(live), live);
check("progress text updates", /^1 of \d+ steps/.test(await page.locator("#progress-text").textContent()));

// Next stage → focus to stage heading
await page.getByRole("button", { name: "Next stage →" }).click();
check("focus moves to stage heading", await page.evaluate(() => document.activeElement?.id) === "stage-title");
check("stage 2 shown", (await page.locator("#stage-title").textContent()) === "Build your certificate authority");

// Copy button
await page.getByRole("button", { name: /^Copy/ }).first().click();
await page.waitForTimeout(150);
const clip = await page.evaluate(() => navigator.clipboard.readText());
check("copy puts command on clipboard", clip.startsWith("step version"), JSON.stringify(clip.slice(0, 30)));

// Focus visibility on a button
await page.getByRole("button", { name: "← Previous stage" }).focus();
await page.keyboard.press("Tab");
const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle + " " + getComputedStyle(document.activeElement).outlineWidth);
check("focus indicator visible", !outline.startsWith("none"), outline);

// No storage before opt-in
check("nothing stored before opt-in", await page.evaluate(() => localStorage.length) === 0);

// Opt in → stored contents are ids only → reload restores
await page.getByLabel("Remember my progress on this device").check();
const stored = await page.evaluate(() => localStorage.getItem("sp.wifi-enterprise.progress"));
check("stored after opt-in (ids only)", !!stored && /^\{"v":1,"answers":\{[^}]*\},"done":\["[a-z0-9-]+"\]\}$/.test(stored), stored);
await page.reload();
await page.locator("#path-title").waitFor();
check("reload restores path and progress", /^1 of/.test(await page.locator("#progress-text").textContent()));

// Download checklist
const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download checklist (.md)" }).click()]);
const md = readFileSync(await download.path(), "utf8");
check("download filename taxonomy", /^\d{4}-\d{2}-\d{2}_wifi-enterprise-checklist_v\d+\.\d+\.\d+\.md$/.test(download.suggestedFilename()), download.suggestedFilename());
check("download has frontmatter and a checked item", md.startsWith("---\n") && md.includes("- [x] "));

// Opt out → storage cleared
await page.getByLabel("Remember my progress on this device").uncheck();
check("opt-out clears storage", await page.evaluate(() => localStorage.length) === 0);

// Mobile layout
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(150);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("no horizontal page scroll at 375px", overflow <= 0, `overflow ${overflow}px`);
const small = await page.evaluate(() => [...document.querySelectorAll("main button, main label, main summary")]
  .filter((el) => el.offsetParent !== null && el.getBoundingClientRect().height < 43.5).map((el) => el.textContent.trim().slice(0, 30)));
check("touch targets ≥ 44px tall", small.length === 0, small.join(" | "));
await page.screenshot({ path: SHOTS + "04-guide-mobile.png", fullPage: true });

// Not-yet path
page.once("dialog", (d) => d.accept());
await page.getByRole("button", { name: "Start over" }).click();
for (const id of ["accessPoints-consumer", "maintainer-yes", "radiusHost-onsite", "mdm-no", "platforms-apple", "personalDevices-no"]) {
  await page.locator(`#${id}`).check();
}
await page.getByRole("button", { name: "Show my path" }).click();
await page.locator("#path-title").waitFor();
const notYet = await page.getByRole("navigation", { name: "Guide stages" }).getByRole("button").allTextContents();
check("not-yet path shows only hardening", notYet.length === 1 && notYet[0].includes("current Wi-Fi"), notYet.join(" | "));
await page.setViewportSize({ width: 1280, height: 900 });
await page.screenshot({ path: SHOTS + "05-not-yet.png", fullPage: true });
await axe("not-yet path");

const external = requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("blob:") && !u.startsWith("data:"));
check("no third-party or network requests", external.length === 0, external.join(", "));
check("no console errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} passed`);
