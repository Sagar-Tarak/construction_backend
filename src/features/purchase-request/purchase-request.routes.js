const express = require("express");
const router = express.Router();

const {
  authenticate,
  authenticateMember,
  requirePermission,
} = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  approveRejectSchema,
} = require("./purchase-request.validators");
const {
  getAll,
  getOne,
  create,
  update,
  approveReject,
  softDelete,
} = require("./purchase-request.controller");

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createPurchaseRequestSchema), create);
router.patch(
  "/:id",
  authenticate,
  validate(updatePurchaseRequestSchema),
  update,
);
router.delete("/:id", authenticate, softDelete);

// ── Approve / Reject ──────────────────────────────────────────────────────────
// Both admin (authenticate) and permitted members (authenticateMember + requirePermission)
// can action a PR. Two separate routes handle both token types.
router.patch(
  "/:id/action",
  authenticateMember,
  requirePermission("purchase_request", "approve"),
  validate(approveRejectSchema),
  approveReject,
);

module.exports = router;
