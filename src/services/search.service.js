const he = require("he");
const fs = require("fs");
const path = require("path");

const { chromium } = require("playwright-extra");
// const StealthPlugin = require("playwright-extra-plugin-stealth");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
chromium.use(StealthPlugin());

// ================== CONFIG ==================
const HEADLESS = process.env.HEADLESS !== "false"; // default true
const LINKEDIN_SESSION_PATH = path.join(
  process.cwd(),
  "sessions",
  "linkedinSession.json",
);

// ================== HELPERS ==================
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function filterSocialLinks(results, platform) {
  return results.filter((r) => {
    const link = r.link || "";

    if (platform === "linkedin") return link.includes("linkedin.com/in/");
    if (platform === "instagram")
      return link.match(/^https?:\/\/(www\.)?instagram\.com\/[^\/]+\/?$/);

    if (platform === "tiktok")
      return link.match(/^https?:\/\/(www\.)?tiktok\.com\/@[^\/]+\/?$/);

    if (platform === "facebook")
      return link.match(/^https?:\/\/(www\.)?facebook\.com\/[^\/]+\/?$/);

    return true;
  });
}

function buildQuery(query, platform) {
  if (platform === "linkedin") return `"${query}" site:linkedin.com/in`;
  if (platform === "instagram") return `"${query}" site:instagram.com`;
  if (platform === "tiktok") return `"${query}" site:tiktok.com`;
  if (platform === "facebook") return `"${query}" site:facebook.com`;

  return `"${query}"`;
}

// ================== PLAYWRIGHT SEARCH ==================
async function browserSearch(page, query, platform) {
  const baseUrl = "https://duckduckgo.com/?q=";
  const sQuery = buildQuery(query, platform);

  await page.goto(`${baseUrl}${encodeURIComponent(sQuery)}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // human-ish behavior
  // await page.waitForTimeout(random(1000, 2000));
  // await page.mouse.move(random(200, 800), random(200, 500));
  // await page.waitForTimeout(random(500, 1500));
  // await page.mouse.wheel(0, random(500, 1200));
  // await page.waitForTimeout(random(1000, 2000));

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
      .filter((x) => x.link),
  );

  return results.map((r) => ({
    ...r,
    snippet: he.decode(r.snippet || ""),
  }));
}

// ================== MULTI SOCIAL SEARCH ==================
async function multiSocialSearch(query) {
  const platforms = ["linkedin", "instagram", "tiktok", "facebook"];
  const allResults = {};

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  for (const platform of platforms) {
    console.log(`🔎 Searching platform: ${platform}`);

    try {
      const results = await browserSearch(page, query, platform);
      allResults[platform] = filterSocialLinks(results, platform);

      await sleep(random(2000, 4000));
    } catch (err) {
      console.log(`❌ Search error ${platform}:`, err.message);
      allResults[platform] = [];
    }
  }

  await browser.close();
  return allResults;
}

// ================= LINKEDIN SCRAPER =================
async function scrapeLinkedInProfile(context, url) {
  const page = await context.newPage();

  page.on("console", (msg) => {
    console.log("🌐 BROWSER LOG:", msg.text());
  });

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const currentUrl = page.url();
    const title = await page.title();

    // security check
    if (
      title.toLowerCase().includes("security verification") ||
      currentUrl.includes("checkpoint")
    ) {
      await page.close();
      return null;
    }

    // authwall
    if (currentUrl.includes("authwall") || currentUrl.includes("login")) {
      console.log("🚫 Authwall:", url);
      await page.close();
      return null;
    }

    const html = await page.content();
    if (
      html.includes("error 999") ||
      html.includes("Request blocked") ||
      html.includes("You’re out of requests")
    ) {
      console.log("🚫 LinkedIn blocked (999).");
      await page.close();
      return null;
    }

    await page.waitForTimeout(random(500, 500));

    const data = await page.evaluate(() => {
      const getMeta = (prop) =>
        document.querySelector(`meta[property="${prop}"]`)?.content || "";

      return {
        title: getMeta("og:title"),
        description: getMeta("og:description"),
      };
    });

    if (!data.title || data.title.toLowerCase().includes("sign up")) {
      await page.close();
      return null;
    }

    const cards = await page.evaluate(() => {
      const expSection =
        document.querySelector('section[data-section="experience"]') ||
        document.querySelector("section.pp-section.experience");

      const eduSection =
        document.querySelector('section[data-section="educationsDetails"]') ||
        document.querySelector("section.education");

      const normalize = (t) => (t || "").replace(/\s+/g, " ").trim();

      const parseExperience = (section) => {
        if (!section) return [];

        return Array.from(section.querySelectorAll("li.experience-item"))
          .map((el) => {
            const title = normalize(
              el.querySelector(".experience-item__title")?.innerText,
            );

            const company = normalize(
              el.querySelector(".experience-item__subtitle")?.innerText,
            );

            const date = normalize(el.querySelector(".date-range")?.innerText);

            // lokasi (kadang ada, kadang ghosting)
            const location = normalize(
              el.querySelectorAll(".experience-item__meta-item")[1]?.innerText,
            );

            // deskripsi / jobdesk
            const description = normalize(
              el.querySelector(".show-more-less-text__text--less")?.innerText,
            );

            return {
              title,
              company,
              date,
              location,
              description,
            };
          })
          .filter((x) => x.title || x.company)
          .slice(0, 3);
      };

      const parseEducation = (section) => {
        if (!section) return [];

        return Array.from(section.querySelectorAll("li.education__list-item"))
          .map((el) => {
            // school
            const school = normalize(el.querySelector("h3 span")?.innerText);

            // ambil semua span di h4 (degree, field, kadang GPA)
            const spans = el.querySelectorAll("h4 span");

            const degree = normalize(spans[0]?.innerText);
            const field = normalize(spans[1]?.innerText);
            const extra = normalize(spans[2]?.innerText); // kadang GPA, kadang kosong

            const date = normalize(el.querySelector(".date-range")?.innerText);

            const description = normalize(
              el.querySelector(".show-more-less-text__text--less")?.innerText,
            );

            return {
              school,
              degree,
              field,
              extra,
              date,
              description,
            };
          })
          .filter((x) => x.school)
          .slice(0, 3);
      };

      console.log("exp: ", expSection);
      console.log("edu: ", eduSection);

      return {
        experience: parseExperience(expSection),
        education: parseEducation(eduSection),
      };
    });

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
  const allResults = await multiSocialSearch(query);

  const linkedinResults = (allResults.linkedin || []).slice(0, 5);
  const enrichedLinkedin = [];

  // LinkedIn enrichment browser
  const browser = await chromium.launch({ headless: HEADLESS });

  const contextOptions = {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    ignoreHTTPSErrors: true,
  };

  // load session if exists
  if (fs.existsSync(LINKEDIN_SESSION_PATH)) {
    contextOptions.storageState = LINKEDIN_SESSION_PATH;
  } else {
    console.log("⚠️ LinkedIn session file not found:", LINKEDIN_SESSION_PATH);
  }

  const context = await browser.newContext(contextOptions);

  for (const item of linkedinResults) {
    console.log("🔎 Scrape LinkedIn:", item.link);

    const profile = await scrapeLinkedInProfile(context, item.link);

    enrichedLinkedin.push({
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

    await sleep(random(5000, 10000)); // slow down, biar gak 999
  }

  await browser.close();

  return {
    query,
    total: {
      linkedin: enrichedLinkedin.length,
      instagram: (allResults.instagram || []).length,
      tiktok: (allResults.tiktok || []).length,
      facebook: (allResults.facebook || []).length,
    },
    results: {
      linkedin: enrichedLinkedin,
      instagram: allResults.instagram || [],
      tiktok: allResults.tiktok || [],
      facebook: allResults.facebook || [],
    },
  };
}

// ================= EXPORT =================
module.exports = {
  searchWithEnrichment,
};
