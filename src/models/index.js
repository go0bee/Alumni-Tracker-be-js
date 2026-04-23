const Alumni = require("./Alumni");
const AlumniTrackingResult = require("./AlumniTrackingResult");
const AlumniTarget = require("./AlumniTarget");
const TrackingEvidence = require("./TrackingEvidence");

Alumni.hasMany(AlumniTrackingResult, {
  foreignKey: "target_id",
  onDelete: "CASCADE",
});
AlumniTrackingResult.belongsTo(Alumni, { foreignKey: "target_id" });

AlumniTarget.hasMany(TrackingEvidence, {
  foreignKey: "target_id",
  onDelete: "CASCADE",
});
TrackingEvidence.belongsTo(AlumniTarget, { foreignKey: "target_id" });

module.exports = {
  Alumni,
  AlumniTrackingResult,
  AlumniTarget,
  TrackingEvidence,
};