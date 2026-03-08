const express = require("express");
const router = express.Router();
const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createTransferSchema,
  receiveTransferSchema,
} = require("./store-material-transfer.validators");
const {
  createTransfer,
  getAllTransfers,
  getTransferById,
  receiveTransfer,
  cancelTransfer,
  deleteTransfer,
} = require("./store-material-transfer.controller");

router.get("/", authenticate, getAllTransfers);
router.get("/:id", authenticate, getTransferById);
router.post("/", authenticate, validate(createTransferSchema), createTransfer);
router.patch(
  "/:id/receive",
  authenticate,
  validate(receiveTransferSchema),
  receiveTransfer,
);
router.patch("/:id/cancel", authenticate, cancelTransfer);
router.delete("/:id", authenticate, deleteTransfer);

module.exports = router;
