const XLSX = require("xlsx");
const { Alumni } = require("../models");

const REQUIRED_COLUMNS = [
  "Nama Lulusan",
  "NIM",
  "Tahun Masuk",
  "Tanggal Lulus",
  "Fakultas",
  "Program Studi",
];

async function importExcelAlumni(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: "File wajib diupload" });
    }

    if (!req.file.originalname.endsWith(".xlsx")) {
      return res.status(400).json({ detail: "File harus format .xlsx" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return res.status(400).json({ detail: "File excel kosong" });
    }

    const firstRow = rows[0];
    const missingCols = REQUIRED_COLUMNS.filter((c) => !(c in firstRow));

    if (missingCols.length) {
      return res
        .status(400)
        .json({ detail: `Kolom Excel kurang: ${missingCols.join(", ")}` });
    }

    let inserted = 0;
    let skipped = 0;

    const seenNims = new Set();

    for (const row of rows) {
      if (!row["NIM"] || !row["Nama Lulusan"]) {
        skipped++;
        continue;
      }

      const nim = String(row["NIM"]).trim();
      const nama = String(row["Nama Lulusan"]).trim();

      if (!nim || !nama) {
        skipped++;
        continue;
      }

      if (seenNims.has(nim)) {
        skipped++;
        continue;
      }
      seenNims.add(nim);

      const existing = await Alumni.findOne({ where: { nim } });
      if (existing) {
        skipped++;
        continue;
      }

      await Alumni.create({
        nim,
        nama,
        tahun_masuk: row["Tahun Masuk"] ? parseInt(row["Tahun Masuk"]) : null,
        tanggal_lulus: row["Tanggal Lulus"]
          ? String(row["Tanggal Lulus"]).trim()
          : null,
        fakultas: row["Fakultas"] ? String(row["Fakultas"]).trim() : null,
        program_studi: row["Program Studi"]
          ? String(row["Program Studi"]).trim()
          : null,
      });

      inserted++;
    }

    return res.json({
      message: "Import selesai",
      inserted,
      skipped,
      total_rows: rows.length,
    });
  } catch (err) {
    return res.status(500).json({ detail: "Error import excel: " + err.message });
  }
}

module.exports = { importExcelAlumni };