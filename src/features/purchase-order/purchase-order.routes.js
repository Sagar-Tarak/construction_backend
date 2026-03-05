const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updateStatusSchema,
} = require("./purchase-order.validators");
const {
  getAll,
  getOne,
  create,
  update,
  updateStatus,
  softDelete,
} = require("./purchase-order.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createPurchaseOrderSchema), create);
router.patch("/:id", authenticate, validate(updatePurchaseOrderSchema), update);
router.patch(
  "/:id/status",
  authenticate,
  validate(updateStatusSchema),
  updateStatus,
);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
