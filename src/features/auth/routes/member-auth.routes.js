const express = require("express");
const router = express.Router();

const { authenticateMember } = require("../middleware/Auth.middleware");
const validate = require("../middleware/validate.middleware");
const { memberLoginSchema } = require("../validators/member-auth.validators");
const {
  memberLogin,
  memberLogout,
  getMemberMe,
} = require("../controller/member-auth.controller");

// Public
router.post("/login", validate(memberLoginSchema), memberLogin);

// Protected — requires member JWT
router.post("/logout", authenticateMember, memberLogout);
router.get("/me", authenticateMember, getMemberMe);

module.exports = router;
