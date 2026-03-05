const mongoose = require("mongoose");
const TeamMember = require("./team-member.model");

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * ProjectTeamMember is imported inside handlers that need it
 * to avoid circular dependency — Project feature doesn't exist yet.
 * Once Project feature is built this pattern stays the same.
 */
const getProjectTeamMemberModel = () =>
  require("../project/project-team-member.model");

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /api/team-members
 * Lists all active team members scoped to the tenant.
 * Populates designation name for display.
 */
const getAll = async (req, res, next) => {
  try {
    const members = await TeamMember.find({
      user_id: req.user._id,
      active: true,
    })
      .populate("designation_id", "designation_name")
      .sort({ user_name: 1 });

    return res.status(200).json({
      success: true,
      data: { team_members: members },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/team-members/:id
 * Returns a single team member with resolved designation.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const member = await TeamMember.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    }).populate("designation_id", "designation_name");

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    return res
      .status(200)
      .json({ success: true, data: { team_member: member } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/team-members
 * Creates a new team member.
 * Accepts optional project_ids[] — creates project_team_member records in same request (spec §5).
 * user_id always from req.user._id — never req.body.
 */
const create = async (req, res, next) => {
  try {
    const {
      user_name,
      designation_id,
      user_email,
      mobile_number,
      user_pan,
      user_emergency_number,
      password,
      user_address,
      project_ids = [],
    } = req.body;

    // Check duplicate email within tenant
    if (user_email) {
      const emailExists = await TeamMember.findOne({
        user_id: req.user._id,
        user_email,
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          errors: {
            user_email: "A team member with this email already exists.",
          },
        });
      }
    }

    // Check duplicate mobile within tenant
    if (mobile_number) {
      const mobileExists = await TeamMember.findOne({
        user_id: req.user._id,
        mobile_number,
      });
      if (mobileExists) {
        return res.status(409).json({
          success: false,
          errors: {
            mobile_number:
              "A team member with this mobile number already exists.",
          },
        });
      }
    }

    const member = await TeamMember.create({
      user_id: req.user._id, // tenant scope — always from token
      user_name,
      designation_id: designation_id || null,
      user_email: user_email || null,
      mobile_number: mobile_number || null,
      user_pan: user_pan || null,
      user_emergency_number: user_emergency_number || null,
      password,
      user_address: user_address || null,
    });

    // Assign to projects if project_ids provided (spec §5)
    if (project_ids.length > 0) {
      const ProjectTeamMember = getProjectTeamMemberModel();
      const assignments = project_ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((project_id) => ({
          user_id: req.user._id,
          project_id: new mongoose.Types.ObjectId(project_id),
          team_member_id: member._id,
        }));

      if (assignments.length > 0) {
        await ProjectTeamMember.insertMany(assignments, { ordered: false });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Team member created successfully.",
      data: { team_member: member },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/team-members/:id
 * Updates team member fields.
 * Designation change auto-updates permissions on next login (spec §5)
 * — no extra work needed here since permissions are resolved fresh on each login.
 * Password change re-triggers bcrypt pre-save hook.
 */
const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const member = await TeamMember.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    }).select("+password");

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    const { user_email, mobile_number } = req.body;

    // Check email uniqueness if being changed
    if (user_email && user_email !== member.user_email) {
      const emailExists = await TeamMember.findOne({
        user_id: req.user._id,
        user_email,
        _id: { $ne: member._id },
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          errors: {
            user_email: "A team member with this email already exists.",
          },
        });
      }
    }

    // Check mobile uniqueness if being changed
    if (mobile_number && mobile_number !== member.mobile_number) {
      const mobileExists = await TeamMember.findOne({
        user_id: req.user._id,
        mobile_number,
        _id: { $ne: member._id },
      });
      if (mobileExists) {
        return res.status(409).json({
          success: false,
          errors: {
            mobile_number:
              "A team member with this mobile number already exists.",
          },
        });
      }
    }

    // Prevent user_id overwrite — strip it from body if someone sends it
    const { user_id: _removed, project_ids: _ignored, ...safeBody } = req.body;
    Object.assign(member, safeBody);
    await member.save(); // pre-save hook fires for password if modified

    return res.status(200).json({
      success: true,
      message: "Team member updated successfully.",
      data: { team_member: member.toJSON() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/team-members/:id
 * Soft delete — sets active: false.
 * Scoped to tenant.
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const member = await TeamMember.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    member.active = false;
    await member.save();

    return res.status(200).json({
      success: true,
      message: "Team member deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/team-members/:id/projects
 * Returns all projects assigned to a team member (spec §5).
 */
const getAssignedProjects = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    // Verify member belongs to this tenant
    const member = await TeamMember.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    const ProjectTeamMember = getProjectTeamMemberModel();

    const assignments = await ProjectTeamMember.find({
      team_member_id: member._id,
      user_id: req.user._id,
    }).populate("project_id", "project_name active");

    const projects = assignments
      .filter((a) => a.project_id) // guard orphaned refs
      .map((a) => a.project_id);

    return res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  softDelete,
  getAssignedProjects,
};
