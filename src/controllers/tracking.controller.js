const { Alumni, AlumniTrackingResult } = require("../models");
const { runScraperLogic } = require("../services/scraper.service");
const { searchWithEnrichment } = require("../services/search.service");

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
  console.log("ambil semua data alumni dengan pagination!");

  try {
    const page = parseInt(req.query.page) || 1; // default page 1
    const limit = parseInt(req.query.limit) || 20; // default 20 data per page
    const offset = (page - 1) * limit;

    const { count, rows } = await Alumni.findAndCountAll({
      limit,
      offset,
      order: [["id", "ASC"]], // optional, biar konsisten
    });

    res.json({
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalData: count,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi error", error });
  }
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
      return res.json({
        message: "Alumni sudah pernah ditrack",
        id: target.id,
      });
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

async function runTrackingSocial(req, res) {
  try {
    const target_id = parseInt(req.params.target_id);

    const target = await Alumni.findOne({ where: { id: target_id } });

    if (!target) {
      return res.status(404).json({ detail: "Alumni tidak ditemukan" });
    }

    if (target.is_tracked) {
      return res.json({
        message: "Alumni sudah pernah ditrack",
        id: target.id,
      });
    }

    // jalankan scraping
    const scraper_output = await searchWithEnrichment(target.nama);

    const results = scraper_output.results || {};
    const linkedinResults = results.linkedin || [];
    const instagramResults = results.instagram || [];
    const facebookResults = results.facebook || [];
    const tiktokResults = results.tiktok || [];

    // kalau ada hasil apapun, simpan tracking result
    if (
      linkedinResults.length ||
      instagramResults.length ||
      instagramResults.length ||
      tiktokResults.length
    ) {
      const newTrackingResult = await AlumniTrackingResult.create({
        target_id: target.id,
      });

      if (linkedinResults.length) {
        const topLinkedin = linkedinResults[0];
        newTrackingResult.link_linkedin = topLinkedin.link;

        // experience
        if (topLinkedin.rich_data?.cards?.experience?.length) {
          const exp = topLinkedin.rich_data.cards.experience[0];
          newTrackingResult.posisi_kerja = exp.title || null;
          newTrackingResult.tempat_kerja = exp.company || null;
        }

        // education UMM priority
        const edu = pickBestEducation(topLinkedin);

        if (edu) {
          newTrackingResult.pendidikan = edu.school || null; // pastikan field ini ada di tabel
          newTrackingResult.tahun_pendidikan = edu.date || null; // pastikan field ini ada
        }
      }

      if (instagramResults.length) {
        newTrackingResult.link_instagram = instagramResults[0].link;
      }

      if (facebookResults.length) {
        newTrackingResult.link_facebook = facebookResults[0].link;
      }

      if (tiktokResults.length) {
        newTrackingResult.link_tiktok = tiktokResults[0].link;
      }

      await newTrackingResult.save();
    }

    // update status tracked
    target.is_tracked = true;
    await target.save();

    return res.json({
      status: "success",
      detail: {
        total: scraper_output.total,
        results: scraper_output.results,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      detail: err.message,
    });
  }
}

async function runTrackingSocialBatch(req, res) {
  try {
    const limit = parseInt(req.query.limit || "50");
    const delay = parseInt(req.query.delay || "5000"); // ms

    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        detail: "limit harus 1 - 1000",
      });
    }

    const alumniList = await Alumni.findAll({
      where: { is_tracked: false },
      limit,
    });

    if (!alumniList.length) {
      return res.json({
        status: "done",
        message: "Tidak ada alumni yang perlu ditrack",
      });
    }

    let success = 0;
    let failed = 0;
    const logs = [];

    for (const alumni of alumniList) {
      console.log(`🚀 Tracking alumni: ${alumni.id} - ${alumni.nama}`);

      try {
        const scraper_output = await searchWithEnrichment(alumni.nama);

        const results = scraper_output.results || {};
        const linkedinResults = results.linkedin || [];
        const instagramResults = results.instagram || [];
        const facebookResults = results.facebook || [];
        const tiktokResults = results.tiktok || [];

        if (
          linkedinResults.length ||
          instagramResults.length ||
          facebookResults.length ||
          tiktokResults.length
        ) {
          const newTrackingResult = await AlumniTrackingResult.create({
            target_id: alumni.id,
          });

          // ===== LinkedIn =====
          if (linkedinResults.length) {
            // cari yang punya UMM education dulu dari semua linkedinResults
            let bestLinkedin = linkedinResults[0];

            for (const item of linkedinResults) {
              const edu = pickBestEducation(item);
              if (edu) {
                const school = (edu.school || "").toLowerCase();
                if (
                  school.includes("umm") ||
                  school.includes("universitas muhammadiyah malang")
                ) {
                  bestLinkedin = item;
                  break;
                }
              }
            }

            newTrackingResult.link_linkedin = bestLinkedin.link;

            // experience
            if (bestLinkedin.rich_data?.cards?.experience?.length) {
              const exp = bestLinkedin.rich_data.cards.experience[0];
              newTrackingResult.posisi_kerja = exp.title || null;
              newTrackingResult.tempat_kerja = exp.company || null;
            }

            // education UMM priority
            const edu = pickBestEducation(bestLinkedin);
            if (edu) {
              newTrackingResult.pendidikan = edu.school || null;
              newTrackingResult.tahun_pendidikan = edu.date || null;
            }
          }

          // ===== Instagram =====
          if (instagramResults.length) {
            newTrackingResult.link_instagram = instagramResults[0].link;
          }

          // ===== Facebook =====
          if (facebookResults.length) {
            newTrackingResult.link_facebook = facebookResults[0].link;
          }

          // ===== TikTok =====
          if (tiktokResults.length) {
            newTrackingResult.link_tiktok = tiktokResults[0].link;
          }

          await newTrackingResult.save();
        }

        alumni.is_tracked = true;
        await alumni.save();

        success++;
        logs.push({
          id: alumni.id,
          nama: alumni.nama,
          status: "success",
        });
      } catch (err) {
        failed++;
        logs.push({
          id: alumni.id,
          nama: alumni.nama,
          status: "failed",
          error: err.message,
        });
      }

      // delay biar gak brutal
      await sleep(delay);
    }

    return res.json({
      status: "finished",
      total_processed: alumniList.length,
      success,
      failed,
      logs,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      detail: err.message,
    });
  }
}

function pickBestEducation(linkedinItem) {
  const eduList = linkedinItem?.rich_data?.cards?.education || [];

  if (!eduList.length) return null;

  const keywords = ["umm", "universitas muhammadiyah malang"];

  const match = eduList.find((edu) => {
    const school = (edu.school || "").toLowerCase();
    return keywords.some((k) => school.includes(k));
  });

  return match || eduList[0];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  getAllAlumni,
  getAllTrackedData,
  runTracking,
  runTrackingAll,
  runTrackingSocial,
  runTrackingSocialBatch,
};
