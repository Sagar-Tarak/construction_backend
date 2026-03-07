const express = require("express");
const router = express.Router();
const { authenticateSuperAdmin } = require("./super-admin.middleware");
const { loginSchema, rejectSchema } = require("./super-admin.validators");
const validate = require("../auth/middleware/validate.middleware");
const ctrl = require("./super-admin.controller");

// Public
router.post("/login", validate(loginSchema), ctrl.login);

// Protected — super admin only
router.get("/me", authenticateSuperAdmin, ctrl.getMe);
router.get("/companies", authenticateSuperAdmin, ctrl.getCompanies);
router.get("/companies/:id", authenticateSuperAdmin, ctrl.getCompany);
router.patch(
  "/companies/:id/approve",
  authenticateSuperAdmin,
  ctrl.approveCompany,
);
router.patch(
  "/companies/:id/reject",
  authenticateSuperAdmin,
  validate(rejectSchema),
  ctrl.rejectCompany,
);
router.patch(
  "/companies/:id/suspend",
  authenticateSuperAdmin,
  ctrl.suspendCompany,
);
router.patch(
  "/companies/:id/reactivate",
  authenticateSuperAdmin,
  ctrl.reactivateCompany,
);

module.exports = router;
