const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TrackingEvidence = sequelize.define(
  "TrackingEvidence",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    target_id: { type: DataTypes.INTEGER, allowNull: false },

    source_name: { type: DataTypes.STRING(255), allowNull: true },
    raw_data_url: { type: DataTypes.TEXT, allowNull: true },
    snippet_content: { type: DataTypes.TEXT, allowNull: true },
    extracted_score: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  },
  {
    tableName: "tracking_evidence",
    timestamps: false,
  }
);

module.exports = TrackingEvidence;