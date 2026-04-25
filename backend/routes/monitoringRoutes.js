const express = require("express");
const router = express.Router();

const {
  getMonitoringData,
} = require("../controllers/monitoringController");

router.get("/:userId", getMonitoringData);

module.exports = router;