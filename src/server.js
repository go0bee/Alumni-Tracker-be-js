require("dotenv").config();
const app = require("./app");
const sequelize = require("./db");
require("./models"); // associations

const PORT = process.env.PORT || 8005;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("DB Connected.");

    await sequelize.sync();
    console.log("DB Synced.");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server failed:", err.message);
  }
}

startServer();