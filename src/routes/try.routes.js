const express = require("express");
const { searchGoogle, searchDuck, search, searchWithEnrichmentController } = require("../controllers/try.controller");

const router = express.Router();

router.get("/google", searchGoogle);
router.get("/duck", searchDuck);
router.get("", search);
router.get("/enrich", searchWithEnrichmentController);

module.exports = router;