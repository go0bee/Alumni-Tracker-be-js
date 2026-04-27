const ExcelJS = require("exceljs");
const db = require("../db");
const fs = require("fs");
const path = require("path");

async function exportAlumniToExcel() {
  try {
    const query = `
      SELECT 
        a.nama,
        a.nim,
        atr.link_instagram,
        atr.link_tiktok,
        atr.link_facebook,
        atr.link_linkedin,
        atr.tempat_kerja,
        atr.alamat_kerja,
        atr.posisi_kerja,
        atr.jenis_industri
      FROM alumni a
      LEFT JOIN alumni_tracking_results atr 
        ON a.id = atr.target_id
      WHERE a.is_tracked = true
    `;

    const [rows] = await db.query(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Alumni Data");

    worksheet.columns = [
      { header: "Nama", key: "nama", width: 25 },
      { header: "NIM", key: "nim", width: 15 },
      { header: "Instagram", key: "link_instagram", width: 30 },
      { header: "TikTok", key: "link_tiktok", width: 30 },
      { header: "Facebook", key: "link_facebook", width: 30 },
      { header: "LinkedIn", key: "link_linkedin", width: 30 },
      { header: "Tempat Kerja", key: "tempat_kerja", width: 25 },
      { header: "Alamat Kerja", key: "alamat_kerja", width: 30 },
      { header: "Posisi Kerja", key: "posisi_kerja", width: 20 },
      { header: "Jenis Industri", key: "jenis_industri", width: 20 },
    ];

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    worksheet.getRow(1).font = { bold: true };

    // ✅ FIX PATH
    const dir = path.join(__dirname, "../../exports");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, "alumni.xlsx");

    await workbook.xlsx.writeFile(filePath);

    return filePath;
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
}

module.exports = {
  exportAlumniToExcel,
};