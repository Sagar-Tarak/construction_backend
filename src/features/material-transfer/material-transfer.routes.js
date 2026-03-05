const express = require("express");
const router = express.Router();
const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createTransferSchema,
  receiveTransferSchema,
} = require("./material-transfer.validators");
const {
  getAll,
  getOne,
  create,
  receiveTransfer,
  cancelTransfer,
  softDelete,
} = require("./material-transfer.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createTransferSchema), create);
router.patch(
  "/:id/receive",
  authenticate,
  validate(receiveTransferSchema),
  receiveTransfer,
);
router.patch("/:id/cancel", authenticate, cancelTransfer);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
