    const express = require("express");
    const multer = require("multer");
    const { importExcelAlumni } = require("../controllers/admin.controller");

    const router = express.Router();
    const upload = multer({ storage: multer.memoryStorage() });

    router.post("/import-excel", upload.single("file"), importExcelAlumni);

    module.exports = router;