const { chromium } = require("playwright");

(async () => {
  console.log("=== PLAYWRIGHT NETWORK TEST ===");

  const browser = await chromium.launch({
    headless: true,
    // kalau di linux/docker sering butuh ini
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // TEST 1: example.com (harusnya selalu bisa)
  try {
    console.log("\n[TEST 1] Opening https://example.com ...");
    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ example.com OK");
  } catch (err) {
    console.log("❌ example.com FAILED:", err.message);
  }

  // TEST 2: google.com
  try {
    console.log("\n[TEST 2] Opening https://www.google.com ...");
    await page.goto("https://www.google.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ google.com OK");
  } catch (err) {
    console.log("❌ google.com FAILED:", err.message);
  }

  // TEST 3: duckduckgo.com
  try {
    console.log("\n[TEST 3] Opening https://duckduckgo.com ...");
    await page.goto("https://duckduckgo.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ duckduckgo.com OK");
  } catch (err) {
    console.log("❌ duckduckgo.com FAILED:", err.message);
  }

  // TEST 4: duckduckgo search query
  try {
    console.log("\n[TEST 4] Searching DuckDuckGo query ...");
    await page.goto("https://duckduckgo.com/?q=hasbi+linkedin", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ duckduckgo search OK");
  } catch (err) {
    console.log("❌ duckduckgo search FAILED:", err.message);
  }

  try {
    console.log("\n[TEST 5] Open linkedin ...");
    await page.goto("https://linkedin.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ linkedin open OK");
  } catch (err) {
    console.log("❌ linkedin open FAILED:", err.message);
  }

  try {
    console.log("\n[TEST 6] open fb ...");
    await page.goto("https://facebook.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ open fb OK");
  } catch (err) {
    console.log("❌ open fb FAILED:", err.message);
  }

  try {
    console.log("\n[TEST 7] open ig ...");
    await page.goto("https://instagram.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ open ig OK");
  } catch (err) {
    console.log("❌ open ig FAILED:", err.message);
  }

  try {
    console.log("\n[TEST 6] open tiktok ...");
    await page.goto("https://tiktok.com", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    console.log("✅ open tiktol OK");
  } catch (err) {
    console.log("❌ open tiktok FAILED:", err.message);
  }

  console.log("\n=== TEST DONE ===");
  await browser.close();
})();