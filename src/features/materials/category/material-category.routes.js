const express = require("express");
const router = express.Router();
const { authenticate } = require("../../auth/middleware/Auth.middleware");
const validate = require("../../auth/middleware/validate.middleware");
const {
  createMaterialCategorySchema,
  updateMaterialCategorySchema,
} = require("./material-category.validators");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./material-category.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createMaterialCategorySchema), create);
router.patch(
  "/:id",
  authenticate,
  validate(updateMaterialCategorySchema),
  update,
);
router.delete("/:id", authenticate, softDelete);

module.exports = router;
