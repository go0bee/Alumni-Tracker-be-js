const axios = require("axios");
const cheerio = require("cheerio");

async function duckSearch(query) {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const $ = cheerio.load(res.data);

    console.log("DuckDuckGo:", $.html()); // Debug: log the raw HTML to understand the structure

    const results = [];

    $(".result").each((i, el) => {
      const title = $(el).find(".result__a").text();
      const link = $(el).find(".result__a").attr("href");
      const snippet = $(el).find(".result__snippet").text();

      if (title && link) {
        results.push({
          title,
          link,
          snippet,
        });
      }
    });

    return results;
  } catch (err) {
    throw new Error("Duck search error: " + err.message);
  }
}

module.exports = {
  duckSearch,
};