const express = require("express");
const router = express.Router();

const { authenticate } = require("../auth/middleware/Auth.middleware");
const validate = require("../auth/middleware/validate.middleware");
const {
  createTeamMemberSchema,
  updateTeamMemberSchema,
} = require("./team.member.validators");
const {
  getAll,
  getOne,
  create,
  update,
  softDelete,
  getAssignedProjects,
} = require("./team-member.controller");

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, validate(createTeamMemberSchema), create);
router.patch("/:id", authenticate, validate(updateTeamMemberSchema), update);
router.delete("/:id", authenticate, softDelete);
router.get("/:id/projects", authenticate, getAssignedProjects);

module.exports = router;
