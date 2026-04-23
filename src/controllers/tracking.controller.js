const { Alumni, AlumniTrackingResult } = require("../models");
const { runScraperLogic } = require("../services/scraper.service");

function parseLinkedinRichData(rich_data) {
  let posisi = null;
  let tempat = null;
  let alamat = null;

  if (Array.isArray(rich_data)) {
    if (rich_data.length > 0) alamat = rich_data[0];
    if (rich_data.length > 1) posisi = rich_data[1];
    if (rich_data.length > 2) tempat = rich_data[2];
  }

  return { posisi, tempat, alamat };
}

async function getAllAlumni(req, res) {
  const data = await Alumni.findAll();
  res.json(data);
}

async function getAllTrackedData(req, res) {
  const data = await AlumniTrackingResult.findAll();
  res.json(data);
}

async function runTracking(req, res) {
  try {
    const target_id = parseInt(req.params.target_id);

    const target = await Alumni.findOne({ where: { id: target_id } });

    if (!target) {
      return res.status(404).json({ detail: "Alumni tidak ditemukan" });
    }

    if (target.is_tracked) {
      return res.json({ message: "Alumni sudah pernah ditrack", id: target.id });
    }

    const scraper_output = await runScraperLogic(target.id, target.nama);
    const track_results = scraper_output.data || [];

    if (track_results.length) {
      const newTrackingResult = await AlumniTrackingResult.create({
        target_id: target.id,
      });

      for (const result of track_results) {
        const link = (result.link || "").toLowerCase();

        if (link.includes("linkedin.com")) {
          newTrackingResult.link_linkedin = result.link;

          const rich = result.rich_data || [];
          const parsed = parseLinkedinRichData(rich);

          newTrackingResult.posisi_kerja = parsed.posisi;
          newTrackingResult.tempat_kerja = parsed.tempat;
          newTrackingResult.alamat_kerja = parsed.alamat;
        } else if (link.includes("instagram.com")) {
          newTrackingResult.link_instagram = result.link;
        } else if (link.includes("facebook.com")) {
          newTrackingResult.link_facebook = result.link;
        } else if (link.includes("tiktok.com")) {
          newTrackingResult.link_tiktok = result.link;
        }
      }

      await newTrackingResult.save();
    }

    target.is_tracked = true;
    await target.save();

    return res.json({
      status: "success",
      detail: {
        top_results: scraper_output.data,
        best_match: scraper_output.best_match,
      },
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
}

async function runTrackingAll(req, res) {
  try {
    const targets = await Alumni.findAll({ where: { is_tracked: false } });

    if (!targets.length) {
      return res.json({ message: "Tidak ada data alumni untuk di-track" });
    }

    const summary = [];

    for (const target of targets) {
      try {
        const scraper_output = await runScraperLogic(target.id, target.nama);
        const track_results = scraper_output.data || [];

        const trackingEntry = await AlumniTrackingResult.create({
          target_id: target.id,
        });

        for (const result of track_results) {
          const link = (result.link || "").toLowerCase();

          if (link.includes("linkedin.com")) {
            trackingEntry.link_linkedin = result.link;

            const rich = result.rich_data || [];
            const parsed = parseLinkedinRichData(rich);

            trackingEntry.posisi_kerja = parsed.posisi;
            trackingEntry.tempat_kerja = parsed.tempat;
            trackingEntry.alamat_kerja = parsed.alamat;
          } else if (link.includes("instagram.com")) {
            trackingEntry.link_instagram = result.link;
          } else if (link.includes("facebook.com")) {
            trackingEntry.link_facebook = result.link;
          } else if (link.includes("tiktok.com")) {
            trackingEntry.link_tiktok = result.link;
          }
        }

        await trackingEntry.save();

        target.is_tracked = true;
        await target.save();

        summary.push({ id: target.id, status: "processed" });
      } catch (err) {
        summary.push({ id: target.id, status: "failed: " + err.message });
      }
    }

    return res.json({
      status: "batch_process_completed",
      total: targets.length,
      summary,
    });
  } catch (err) {
    return res.status(500).json({ detail: err.message });
  }
}

module.exports = {
  getAllAlumni,
  getAllTrackedData,
  runTracking,
  runTrackingAll,
};