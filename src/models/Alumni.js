const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Alumni = sequelize.define(
  "Alumni",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nim: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    nama: { type: DataTypes.STRING(200), allowNull: false },
    tahun_masuk: { type: DataTypes.INTEGER, allowNull: true },
    tanggal_lulus: { type: DataTypes.STRING(50), allowNull: true },
    fakultas: { type: DataTypes.STRING(200), allowNull: true },
    program_studi: { type: DataTypes.STRING(200), allowNull: true },
    is_tracked: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "alumni",
    timestamps: false,
  }
);

module.exports = Alumni;