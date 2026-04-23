const express = require("express");
const {
  getAllAlumni,
  getAllTrackedData,  
  runTracking,
  runTrackingAll,
} = require("../controllers/tracking.controller");

const router = express.Router();

router.get("/all-alumni", getAllAlumni);
router.get("/all-tracked", getAllTrackedData);
router.get("/track/:target_id", runTracking);
router.post("/track-all", runTrackingAll);

module.exports = router;