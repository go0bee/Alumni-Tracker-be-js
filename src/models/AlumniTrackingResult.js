const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AlumniTrackingResult = sequelize.define(
  "AlumniTrackingResult",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    target_id: { type: DataTypes.INTEGER, allowNull: false },

    link_instagram: { type: DataTypes.TEXT, allowNull: true },
    link_linkedin: { type: DataTypes.TEXT, allowNull: true },
    link_facebook: { type: DataTypes.TEXT, allowNull: true },
    link_tiktok: { type: DataTypes.TEXT, allowNull: true },

    tempat_kerja: { type: DataTypes.STRING(255), allowNull: true },
    alamat_kerja: { type: DataTypes.STRING(255), allowNull: true },
    posisi_kerja: { type: DataTypes.STRING(255), allowNull: true },
    jenis_industri: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "alumni_tracking_results",
    timestamps: false,
  }
);

module.exports = AlumniTrackingResult;