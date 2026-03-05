const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createContractorSchema,
  updateContractorSchema,
} = require("./contractor.validator");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./contractor.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createContractorSchema), create);
router.patch("/:id", authenticate, validate(updateContractorSchema), update);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
