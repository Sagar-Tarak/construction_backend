const express = require("express");
const router = express.Router();
const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createStoreSchema,
  updateStoreSchema,
} = require("./project-store.validators");
const {
  createStore,
  getStoresByProject,
  getStoreById,
  updateStore,
  deleteStore,
  getStoreInventory,
  getProjectInventorySummary,
  getStoreTransactions,
  getLowStock,
} = require("./project-store.controller");

// IMPORTANT: specific routes declared BEFORE param routes to avoid shadowing
router.get("/low-stock", authenticate, getLowStock);
router.get("/inventory/summary", authenticate, getProjectInventorySummary);

router.get("/", authenticate, getStoresByProject);
router.get("/:id", authenticate, getStoreById);
router.post("/", authenticate, validate(createStoreSchema), createStore);
router.patch("/:id", authenticate, validate(updateStoreSchema), updateStore);
router.delete("/:id", authenticate, deleteStore);

router.get("/:id/inventory", authenticate, getStoreInventory);
router.get("/:id/transactions", authenticate, getStoreTransactions);

module.exports = router;
