const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createSupplierSchema,
  updateSupplierSchema,
} = require("./supplier.validator");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./supplier.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createSupplierSchema), create);
router.patch("/:id", authenticate, validate(updateSupplierSchema), update);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
