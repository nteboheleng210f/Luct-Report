require("dotenv").config();

const app = require("./app");
const { db } = require("./config/firebase");

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} ✔`);
});