const router = require("express").Router();
const { getClassInit, createClass, assignStudent } = require("../controllers/classController");

router.get("/init/:userId", getClassInit);
router.post("/", createClass);
router.patch("/assign", assignStudent);

module.exports = router;