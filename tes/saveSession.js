const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.linkedin.com");

  console.log("👉 Login manual dulu (60 detik)...");
  await page.waitForTimeout(90000);

  const sessionPath = path.join(__dirname, "../sessions/linkedinSession.json");

  fs.mkdirSync(path.dirname(sessionPath), { recursive: true });

  await context.storageState({ path: sessionPath });

  console.log("✅ Session saved ke:", sessionPath);

  await browser.close();
})();