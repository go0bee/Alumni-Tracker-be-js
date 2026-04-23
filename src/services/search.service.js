const axios = require("axios");
const cheerio = require("cheerio");
const { chromium } = require("playwright");
const he = require("he");

// ================= CAPTCHA DETECT =================
function isCaptcha(html) {
  return (
    html.includes("anomaly") ||
    html.includes("captcha") ||
    html.includes("Select all squares")
  );
}

// ================= DUCK SEARCH =================
async function duckSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (isCaptcha(res.data)) {
    throw new Error("CAPTCHA_DETECTED");
  }

  const $ = cheerio.load(res.data);
  const results = [];

  $(".result").each((i, el) => {
    const title = $(el).find(".result__a").text();
    const link = $(el).find(".result__a").attr("href");
    const snippet = $(el).find(".result__snippet").text();

    if (title && link) {
      results.push({
        title,
        link,
        snippet: he.decode(snippet || ""),
      });
    }
  });

  return results;
}

// ================= PLAYWRIGHT SEARCH =================
async function browserSearch(query) {
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();
  const baseUrl = "https://duckduckgo.com/?q=";

  function buildQuery(nama) {
    return `"${nama}" site:linkedin.com/in ("UMM" OR "Universitas Muhammadiyah Malang")`;
  }

  const sQuery = buildQuery(query);

  await page.goto(`${baseUrl}${encodeURIComponent(sQuery)}`, {
    waitUntil: "domcontentloaded",
    timeout: 20000,
  });

  // await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
  //   waitUntil: "networkidle",
  // });

  // await page.goto(`${url}${encodeURIComponent(query)}`, {
  //   waitUntil: "networkidle",
  //   timeout: 3000,
  // });

  // await page.goto(`${url}${encodeURIComponent(query)}`, {
  //   waitUntil: "domcontentloaded",
  //   timeout: 20000,
  // });

  await page.waitForTimeout(2000);

  const results = await page.$$eval("article", (nodes) =>
    nodes
      .map((el) => {
        const titleEl = el.querySelector("h2 a");
        const snippetEl =
          el.querySelector('[data-result="snippet"]') ||
          el.querySelector(".result__snippet");

        return {
          title: titleEl?.innerText || "",
          link: titleEl?.href || "",
          snippet: snippetEl?.innerText || "",
        };
      })
      .filter((item) => item.link.includes("/in/")),
  );

  await browser.close();

  return results.map((r) => ({
    ...r,
    snippet: he.decode(r.snippet || ""),
  }));
}

// ================= SMART SEARCH =================
async function smartSearch(query) {
  try {
    const results = await duckSearch(query);

    if (!results.length) throw new Error("EMPTY");

    return { source: "axios", results };
  } catch (err) {
    console.log("Fallback ke browser:", err.message);
    const results = await browserSearch(query);
    return { source: "playwright", results };
  }
}

// ================= LINKEDIN SCRAPER =================
async function scrapeLinkedInProfile(context, url) {
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log("🌐 BROWSER LOG:", msg.text());
  });

  console.log("start find data linkedin");

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const currentUrl = page.url();
    if (currentUrl.includes("authwall") || currentUrl.includes("login")) {
      console.log("🚫 Authwall:", url);
      await page.close();
      return null;
    }
    console.log("lolos dari authwall");

    await page.waitForTimeout(2000);
    await page.mouse.move(200, 200);
    await page.waitForTimeout(500);

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let lastHeight = 0;
        let sameCount = 0;

        const timer = setInterval(() => {
          window.scrollBy(0, 400);

          const newHeight = document.body.scrollHeight;

          if (newHeight === lastHeight) {
            sameCount++;
          } else {
            sameCount = 0;
          }

          lastHeight = newHeight;

          // 🔥 kalau 3x gak nambah → stop
          if (sameCount >= 3) {
            clearInterval(timer);
            resolve();
          }
        }, 500);
      });
    });

    await page.waitForTimeout(1500);

    console.log("baca title ama description");
    const data = await page.evaluate(() => {
      const getMeta = (prop) =>
        document.querySelector(`meta[property="${prop}"]`)?.content || "";

      // console.log(
      //   "done dapet: \ntitle:" +
      //     getMeta("og:title") +
      //     "description: " +
      //     getMeta("og:description"),
      // );

      return {
        title: getMeta("og:title"),
        description: getMeta("og:description"),
      };
    });

    if (!data.title || data.title.includes("Sign Up")) {
      await page.close();
      return null;
    }

    const html = await page.content();

    if (
      html.includes("error 999") ||
      html.includes("You’re out of requests") ||
      html.includes("Request blocked")
    ) {
      console.log("🚫 LinkedIn blocked (999).");
      await page.close();
      return null;
    }

    // try {
    //   await page.waitForFunction(
    //     () => {
    //       console.log("cari scroll dikit");
    //       const text = document.body.innerText.toLowerCase();

    //       return [
    //         "experience",
    //         "pengalaman",
    //         "erfaring",
    //         "expérience",
    //         "Pendidikan",
    //       ].some((k) => text.includes(k));
    //     },
    //     { timeout: 8000 },
    //   );
    // } catch (e) {
    //   console.log(
    //     "⚠️ Section experience/education gak ketemu, lanjut meta aja",
    //   );
    // }

    console.log("saatnya");
    const cards = await Promise.race([
      page.evaluate(() => {
        console.log("start find expirience and study");
        const getSection = (keywords) => {
          const sections = Array.from(document.querySelectorAll("main"));

          return sections.find((sec) =>
            keywords.some((k) =>
              sec.textContent.toLowerCase().includes(k.toLowerCase()),
            ),
          );
        };

        const extractItems = (section) => {
          if (!section) return [];

          return Array.from(section.querySelectorAll("li"))
            .map((el) => {
              const text = el.textContent.replace(/\n/g, " ").trim();
              return text.length > 20 ? text : null;
            })
            .filter(Boolean)
            .slice(0, 5); // limit biar gak noise
        };

        return {
          education: extractItems(getSection(["education", "pendidikan"])),
          experience: extractItems(getSection(["experience", "pengalaman"])),
        };
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("EVALUATE_TIMEOUT")), 800);
      }),
    ]);
    console.log("cards:", cards);

    console.log("done");
    await page.close();

    return {
      title: he.decode(data.title || ""),
      description: he.decode(data.description || ""),
      cards,
    };
  } catch (err) {
    console.log("Error profile:", err.message);
    await page.close();
    return null;
  }
}

// ================= MAIN PIPELINE =================
async function searchWithEnrichment(query) {
  const { source, results } = await smartSearch(query);

  // 🔥 SATU browser doang
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    storageState: "sessions/linkedinSession.json",
    ignoreHTTPSErrors: true,
  });

  const limited = results.slice(0, 3);
  const enriched = [];

  for (const item of limited) {
    console.log("🔎 Scrape:", item.link);

    // 👇 kirim context, bukan bikin baru
    const profile = await scrapeLinkedInProfile(context, item.link);

    enriched.push({
      ...item,
      rich_data: profile || {
        title: item.title,
        description: item.snippet,
        cards: {
          education: [],
          experience: [],
        },
      },
    });

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));
  }

  await browser.close();

  return {
    query,
    source,
    total: enriched.length,
    results: enriched,
  };
}

// ================= EXPORT =================
module.exports = {
  searchWithEnrichment,
};
