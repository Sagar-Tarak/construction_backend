const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createOtherPartySchema,
  updateOtherPartySchema,
} = require("./other-party.validators");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./other-party.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createOtherPartySchema), create);
router.patch("/:id", authenticate, validate(updateOtherPartySchema), update);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
