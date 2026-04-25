const app = require("./app");
const { db } = require("./config/firebase");

require("dotenv").config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await db.collection("users").limit(1).get();
    console.log("Firebase connected ✔");
  } catch (err) {
    console.log("Firebase error", err.message);
  }
});