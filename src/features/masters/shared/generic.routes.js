const express = require("express");
const { authenticate } = require("../../auth/middleware/Auth.middleware");
const createLookupController = require("./generic.controller");

/**
 * createLookupRouter(Model, modelLabel, fieldName, referenceModels)
 * Factory that returns a fully wired Express router for any lookup collection.
 *
 * @param {mongoose.Model} Model           - The mongoose model
 * @param {string}         modelLabel      - Human readable label e.g. "Designation"
 * @param {string}         fieldName       - The unique field name e.g. "designation_name"
 * @param {Array}          referenceModels - Dependent models to check before soft delete
 *                                          e.g. [{ model: TeamMember, field: "designation_id", label: "Team Members" }]
 *
 * Usage in each feature's index.js:
 *   const router = createLookupRouter(Designation, "Designation", "designation_name", [
 *     { model: TeamMember, field: "designation_id", label: "Team Members" }
 *   ]);
 */
const createLookupRouter = (Model, modelLabel, fieldName, referenceModels = []) => {
  const router = express.Router();
  const { getAll, getOne, create, update, softDelete } = createLookupController(
    Model,
    modelLabel,
    fieldName,
  );

  router.get("/", authenticate, getAll);
  router.get("/:id", authenticate, getOne);
  router.post("/", authenticate, create);
  router.patch("/:id", authenticate, update);
  router.delete("/:id", authenticate, softDelete(referenceModels));

  return router;
};

module.exports = createLookupRouter;
