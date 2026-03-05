const express = require("express");
const router = express.Router();
const { authenticate } = require("../../auth/middleware/Auth.middleware");
const { getAppModules } = require("../controller/app-module.controller");

router.get("/", authenticate, getAppModules);

module.exports = router;
