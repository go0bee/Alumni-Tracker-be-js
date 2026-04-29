const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.MYSQL_URL, {
  dialect: "mysql",
  logging: false,
  // dialectOptions: {
  //   ssl: {
  //     require: true,
  //     rejectUnauthorized: false,
  //   },
  // },
});

module.exports = sequelize;