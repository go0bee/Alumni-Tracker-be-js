const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AlumniTarget = sequelize.define(
  "AlumniTarget",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nama_asli: { type: DataTypes.STRING(100), allowNull: true },
    variasi_nama: { type: DataTypes.TEXT, allowNull: true },
    keywords: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(50), defaultValue: "UNTRACKED" },
    confidence_score: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    last_run: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "alumni_targets",
    timestamps: false,
  }
);

module.exports = AlumniTarget;