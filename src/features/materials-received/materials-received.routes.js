const express = require("express");
const router = express.Router();
const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createMaterialsReceivedSchema,
  updateMaterialsReceivedSchema,
  updateStatusSchema,
} = require("./materials-received.validators");
const {
  getAll,
  getOne,
  create,
  update,
  updateStatus,
  softDelete,
} = require("./materials-received.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createMaterialsReceivedSchema), create);
router.patch(
  "/:id",
  authenticate,
  validate(updateMaterialsReceivedSchema),
  update,
);
router.patch(
  "/:id/status",
  authenticate,
  validate(updateStatusSchema),
  updateStatus,
);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
