const express = require("express");
const router = express.Router();
const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createMaterialSchema,
  updateMaterialSchema,
} = require("./material.validators");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./material.controller");

// supports ?category_id= query param on getAll (spec §9)
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createMaterialSchema), create);
router.patch("/:id", authenticate, validate(updateMaterialSchema), update);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
