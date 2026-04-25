const router = require("express").Router();
const { getRatingInit, submitRating } = require("../controllers/ratingController");

router.get("/init/:userId", getRatingInit);
router.post("/", submitRating);

module.exports = router;