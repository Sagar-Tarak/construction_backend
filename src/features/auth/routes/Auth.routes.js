const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/Auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} = require("../validators/Auth.validators");
const {
  register,
  login,
  logout,
  getMe,
  updateMe,
} = require("../controller/Auth.controller");

// Public
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// Protected
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, validate(updateProfileSchema), updateMe);

module.exports = router;
