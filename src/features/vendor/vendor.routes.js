const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createVendorSchema,
  updateVendorSchema,
  createShiftSchema,
  updateShiftSchema,
} = require("./vendor.validator");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
  getShifts,
  addShift,
  updateShift,
  deactivateShift,
} = require("./vendor.controller");

// ── Vendor routes ────────────────────────────────────────────────────────────
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createVendorSchema), create);
router.patch("/:id", authenticate, validate(updateVendorSchema), update);
router.delete("/:id", authenticate, softDelete);

// ── Shift routes ─────────────────────────────────────────────────────────────
router.get("/:id/shifts", authenticate, getShifts);
router.post("/:id/shifts", authenticate, validate(createShiftSchema), addShift);
router.patch(
  "/:id/shifts/:shiftId",
  authenticate,
  validate(updateShiftSchema),
  updateShift,
);
router.delete("/:id/shifts/:shiftId", authenticate, deactivateShift);

module.exports = router;
