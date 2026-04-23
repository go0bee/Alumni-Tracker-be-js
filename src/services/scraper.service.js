const axios = require("axios");
require("dotenv").config();

const SERP_API_KEY = process.env.SERP_API_KEY;

const SOCIAL_DOMAINS = [
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "tiktok.com",
];

async function fetchData(query) {
  const url = "https://serpapi.com/search.json";

  try {
    const response = await axios.get(url, {
      params: {
        q: query,
        api_key: SERP_API_KEY,
        engine: "google",
        hl: "id",
        gl: "id",
      },
      timeout: 20000,
    });

    const data = response.data;
    const organic = data.organic_results || [];
    const results = [];

    for (const item of organic.slice(0, 10)) {
      const link = item.link || "";
      if (!link) continue;

      let rich_data = null;

      if (link.toLowerCase().includes("linkedin.com")) {
        rich_data =
          item?.rich_snippet?.top?.extensions ||
          null;
      }

      results.push({
        title: item.title || "",
        snippet: item.snippet || "",
        link,
        rich_data,
      });
    }

    return results;
  } catch (err) {
    console.log("Error fetch API:", err.message);
    return [];
  }
}

function isSocialLink(url) {
  const lower = url.toLowerCase();
  return SOCIAL_DOMAINS.some((domain) => lower.includes(domain));
}

function calculateConfidence(candidate, targetProfile) {
  let score = 0.0;

  const title = (candidate.title || "").toLowerCase();
  const snippet = (candidate.snippet || "").toLowerCase();
  const link = (candidate.link || "").toLowerCase();
  const namaTarget = (targetProfile.nama || "").toLowerCase();

  if (title.includes(namaTarget) || snippet.includes(namaTarget)) score += 0.6;
  if (isSocialLink(link)) score += 0.4;

  return Math.min(score, 1.0);
}

async function runScraperLogic(target_id, target_nama, target_keywords = null) {
  const queries = [
    `"${target_nama}" site:linkedin.com`,
    `"${target_nama}" site:instagram.com`,
    `"${target_nama}" site:facebook.com`,
    `"${target_nama}" site:tiktok.com`,
  ];

  const all_raw_results = [];
  const seen_links = new Set();

  for (const query of queries) {
    const keywordResults = await fetchData(query);

    for (const res of keywordResults) {
      if (!seen_links.has(res.link) && isSocialLink(res.link)) {
        seen_links.add(res.link);
        all_raw_results.push(res);
      }
    }
  }

  const scored_results = [];
  const target_profile = { nama: target_nama };

  for (const candidate of all_raw_results) {
    const score = calculateConfidence(candidate, target_profile);
    scored_results.push({ ...candidate, score });
  }

  const best_per_social = {};

  for (const item of scored_results) {
    const link = item.link.toLowerCase();
    let detected_domain = null;

    for (const domain of SOCIAL_DOMAINS) {
      if (link.includes(domain)) {
        detected_domain = domain;
        break;
      }
    }

    if (detected_domain) {
      if (
        !best_per_social[detected_domain] ||
        item.score > best_per_social[detected_domain].score
      ) {
        best_per_social[detected_domain] = item;
      }
    }
  }

  const top_results = Object.values(best_per_social).sort(
    (a, b) => b.score - a.score
  );

  const best_match = top_results.length
    ? top_results[0]
    : {
        title: "",
        snippet: "Data tidak ditemukan",
        link: "",
        score: 0.0,
      };

  const highest_score = best_match.score;

  let status = "UNTRACKED";
  if (highest_score >= 0.8) status = "IDENTIFIED";
  else if (highest_score >= 0.4) status = "MANUAL_VERIFICATION_REQUIRED";

  return {
    score: highest_score,
    data: top_results,
    best_match,
    status,
  };
}

module.exports = {
  runScraperLogic,
};