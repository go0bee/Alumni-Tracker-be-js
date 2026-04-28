const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/admin.routes");
const trackingRoutes = require("./routes/tracking.routes");
const searchRoute = require("./routes/try.routes");

const app = express();

// app.use(cors({ origin: "*" }));
app.use(
  cors({
    origin: ["https://tracker-alumni.up.railway.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

// console.log("ENV CHECK:", {
//   MYSQL_URL: process.env.MYSQL_URL,
// });

app.use("/admin", adminRoutes);
app.use("/", trackingRoutes);
app.use("/search", searchRoute);

app.get("/", (req, res) => {
  res.json({ message: "API ready 🔥" });
});

module.exports = app;
