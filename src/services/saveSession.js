const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.linkedin.com");

  console.log("👉 Login manual dulu (60 detik)...");
  await page.waitForTimeout(60000*3);

  await context.storageState({ path: "sessions/linkedinSession.json" });

  console.log("✅ Session saved ke session.json");
  await browser.close();
})();