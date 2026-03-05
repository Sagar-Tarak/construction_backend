const express = require("express");
const router = express.Router();
const { authenticate } = require("../auth/middleware/Auth.middleware");
const {
  getAll,
  getOne,
  getTransactions,
} = require("./project-inventory.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.get("/:id/transactions", authenticate, getTransactions);

module.exports = router;
