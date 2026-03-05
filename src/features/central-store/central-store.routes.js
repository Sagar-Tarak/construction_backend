const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");

const {
  createCentralStoreSchema,
  updateCentralStoreSchema,
} = require("./central-store.validators");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
} = require("./central-store.controller");
const {
  getAssignments,
  addAssignment,
  removeAssignment,
} = require("./assigments/assignment.controller");
const {
  getAll: getRequests,
  getOne: getRequest,
  create: createRequest,
  update: updateRequest,
  receiveRequest,
  softDelete: deleteRequest,
} = require("./requests/central-store-request.controller");
const {
  createRequestSchema,
  updateRequestSchema,
  receiveRequestSchema,
} = require("./requests/central-store-request.validators");

// ── Central Store CRUD ────────────────────────────────────────────────────────
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createCentralStoreSchema), create);
router.patch("/:id", authenticate, validate(updateCentralStoreSchema), update);
router.delete("/:id", authenticate, softDelete);

// ── Team Member assignments ───────────────────────────────────────────────────
router.get("/:id/team-members", authenticate, getAssignments("team-members"));
router.post("/:id/team-members", authenticate, addAssignment("team-members"));
router.delete(
  "/:id/team-members/:entityId",
  authenticate,
  removeAssignment("team-members"),
);

// ── Supplier assignments ──────────────────────────────────────────────────────
router.get("/:id/suppliers", authenticate, getAssignments("suppliers"));
router.post("/:id/suppliers", authenticate, addAssignment("suppliers"));
router.delete(
  "/:id/suppliers/:entityId",
  authenticate,
  removeAssignment("suppliers"),
);

// ── Material Requests ─────────────────────────────────────────────────────────
// Note: also supports GET /api/central-store-requests?store_id=&status= at top level
router.get("/:id/requests", authenticate, getRequests);
router.get("/:id/requests/:requestId", authenticate, getRequest);
router.post(
  "/:id/requests",
  authenticate,
  validate(createRequestSchema),
  createRequest,
);
router.patch(
  "/:id/requests/:requestId",
  authenticate,
  validate(updateRequestSchema),
  updateRequest,
);
router.patch(
  "/:id/requests/:requestId/receive",
  authenticate,
  validate(receiveRequestSchema),
  receiveRequest,
);
router.delete("/:id/requests/:requestId", authenticate, deleteRequest);

module.exports = router;
