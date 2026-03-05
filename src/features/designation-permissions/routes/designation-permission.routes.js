const express = require("express");
const router = express.Router();

const {
  authenticate,
  authenticateMember,
} = require("../../auth/middleware/Auth.middleware");
const validate = require("../../auth/middleware/validate.middleware");
const {
  savePermissionsSchema,
} = require("../validators/designation-permission.validators");
const {
  getPermissionMatrix,
  savePermissionMatrix,
  getMyPermissions,
} = require("../controller/designation-permission.controller");

// Team member — get own resolved permissions
// IMPORTANT: must be defined BEFORE /:id/permissions so Express doesn't
// match "me" as a designation id.
router.get("/me/permissions", authenticateMember, getMyPermissions);

// Admin — configure a designation's permissions
router.get("/:id/permissions", authenticate, getPermissionMatrix);
router.post(
  "/:id/permissions",
  authenticate,
  validate(savePermissionsSchema),
  savePermissionMatrix,
);

module.exports = router;
