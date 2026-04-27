const express = require("express");
const {
  getAllAlumni,
  getAllTrackedData,
  runTracking,
  runTrackingAll,
  runTrackingSocial,
  runTrackingSocialBatch,
} = require("../controllers/tracking.controller");

const { getExportData } = require("../controllers/export.controller");

const router = express.Router();

router.get("/all-alumni", getAllAlumni);
router.get("/all-tracked", getAllTrackedData);

router.get("/track/:target_id", runTracking);
router.post("/track-all", runTrackingAll);

// SOCIAL TRACKING
router.post("/track/social/:target_id", runTrackingSocial);
router.post("/track/social/batch", runTrackingSocialBatch);

router.get("/export", getExportData);

module.exports = router;