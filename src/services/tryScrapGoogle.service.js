const axios = require("axios");
const cheerio = require("cheerio");

async function googleSearch(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    },
  });

  const $ = cheerio.load(res.data);
  console.log("Google Search HTML loaded, parsing results...");
  console.log("raw HTML snippet:", $.html()); 

  const results = [];
  $("div.g").each((i, el) => {
    const title = $(el).find("h3").text();
    const link = $(el).find("a").attr("href");
    const snippet = $(el).find(".VwiC3b").text();

    if (title && link) {
      results.push({ title, link, snippet });
    }
  });

  return results;
}

module.exports = {
  googleSearch,
};