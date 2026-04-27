const path = require("path");
const fs = require("fs");
const { exportAlumniToExcel } = require("../services/export.service");

async function getExportData(req, res) {
  try {
    const filePath = await exportAlumniToExcel();

    const absolutePath = path.resolve(filePath);

    // cek file ada atau tidak (biar gak malu di production)
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        message: "File export tidak ditemukan",
      });
    }

    return res.download(absolutePath, "alumni.xlsx", (err) => {
      if (err) {
        console.error("Download error:", err);

        // ❌ JANGAN kirim response lagi kalau header sudah dikirim
        if (!res.headersSent) {
          return res.status(500).send("Gagal download file");
        }
      }

      // hapus file setelah selesai
      fs.unlink(absolutePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Gagal hapus file:", unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error("Export controller error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat export data",
    });
  }
}

module.exports = {
  getExportData,
};
