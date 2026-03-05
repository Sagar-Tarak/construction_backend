const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("./project.validators");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./project.controller");
const {
  getAssignments,
  addAssignment,
  removeAssignment,
} = require("./assignments/assignment.controller");

// ── Project CRUD ─────────────────────────────────────────────────────────────
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createProjectSchema), create);
router.patch("/:id", authenticate, validate(updateProjectSchema), update);
router.delete("/:id", authenticate, softDelete);

// ── Team Member assignments ───────────────────────────────────────────────────
router.get("/:id/team-members", authenticate, getAssignments("team-members"));
router.post("/:id/team-members", authenticate, addAssignment("team-members"));
router.delete(
  "/:id/team-members/:entityId",
  authenticate,
  removeAssignment("team-members"),
);

// ── Contractor assignments ────────────────────────────────────────────────────
router.get("/:id/contractors", authenticate, getAssignments("contractors"));
router.post("/:id/contractors", authenticate, addAssignment("contractors"));
router.delete(
  "/:id/contractors/:entityId",
  authenticate,
  removeAssignment("contractors"),
);

// ── Vendor assignments ────────────────────────────────────────────────────────
router.get("/:id/vendors", authenticate, getAssignments("vendors"));
router.post("/:id/vendors", authenticate, addAssignment("vendors"));
router.delete(
  "/:id/vendors/:entityId",
  authenticate,
  removeAssignment("vendors"),
);

// ── Supplier assignments ──────────────────────────────────────────────────────
router.get("/:id/suppliers", authenticate, getAssignments("suppliers"));
router.post("/:id/suppliers", authenticate, addAssignment("suppliers"));
router.delete(
  "/:id/suppliers/:entityId",
  authenticate,
  removeAssignment("suppliers"),
);

// ── Other Party assignments ───────────────────────────────────────────────────
router.get("/:id/other-parties", authenticate, getAssignments("other-parties"));
router.post("/:id/other-parties", authenticate, addAssignment("other-parties"));
router.delete(
  "/:id/other-parties/:entityId",
  authenticate,
  removeAssignment("other-parties"),
);

module.exports = router;
