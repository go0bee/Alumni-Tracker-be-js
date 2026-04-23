const { googleSearch } = require("../services/tryScrapGoogle.service");
const { duckSearch } = require("../services/duckSearch.service");
const {
  smartSearch,
  searchWithEnrichment,
} = require("../services/search.service");

async function searchGoogle(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query q wajib diisi" });

    const results = await googleSearch(q);

    res.json({
      query: q,
      total: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error searching Google",
      error: err.message,
    });
  }
}

async function searchDuck(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query q wajib diisi" });
    }

    const results = await duckSearch(q);

    res.json({
      query: q,
      total: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error search DuckDuckGo",
      error: err.message,
    });
  }
}

async function search(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query wajib diisi" });
    }

    const data = await smartSearch(q);

    res.json({
      query: q,
      source: data.source,
      total: data.results.length,
      results: data.results,
    });
  } catch (err) {
    res.status(500).json({
      message: "Search error",
      error: err.message,
    });
  }
}

async function searchWithEnrichmentController(req, res) {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query wajib diisi" });
    }

    const data = await searchWithEnrichment(q);

    res.json({
      query: q,
      source: data.source,
      total: data.results.length,
      results: data.results,
    });
  } catch (err) {
    res.status(500).json({
      message: "Search error",
      error: err.message,
    });
  }
}

module.exports = {
  searchGoogle,
  searchDuck,
  search,
  searchWithEnrichmentController,
};
