const mongoose = require("mongoose");
const Project = require("./project.model");
const ProjectTeamMember = require("./assignments/project-team-member.model");
const ProjectContractor = require("./assignments/project-contractor.model");
const ProjectVendor = require("./assignments/project-vendor.model");
const ProjectSupplier = require("./assignments/project-supplier.model");
const ProjectOtherParty = require("./assignments/project-other-party.model");

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/projects
 * Lists all projects for the tenant.
 * CRITICAL: can_view_all enforcement (spec §3.8)
 * If member does NOT have can_view_all — only return projects they are assigned to.
 * Admin (req.user, no req.member) always sees all.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id, active: true };

    // Enforce can_view_all for team members (spec §3.8)
    if (req.member && req.permissions) {
      const canViewAll = req.permissions?.project?.view_all;
      if (!canViewAll) {
        const assigned = await ProjectTeamMember.find({
          team_member_id: req.member._id,
          user_id: req.user._id,
        }).select("project_id");

        filter._id = { $in: assigned.map((a) => a.project_id) };
      }
    }

    const projects = await Project.find(filter)
      .populate("project_status_id", "status_name")
      .populate("project_type_id", "project_type_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: { projects } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/projects/:id
 * Returns project with all assignments populated.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    })
      .populate("project_status_id", "status_name")
      .populate("project_type_id", "project_type_name");

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // Fetch all assignments in parallel
    const [team_members, contractors, vendors, suppliers, other_parties] =
      await Promise.all([
        ProjectTeamMember.find({ project_id: project._id }).populate(
          "team_member_id",
          "user_name user_email designation_id",
        ),
        ProjectContractor.find({ project_id: project._id }).populate(
          "contractor_id",
          "contractor_name contact_number",
        ),
        ProjectVendor.find({ project_id: project._id }).populate(
          "vendor_id",
          "vendor_name address",
        ),
        ProjectSupplier.find({ project_id: project._id }).populate(
          "supplier_id",
          "supplier_name supplier_email supplier_number",
        ),
        ProjectOtherParty.find({ project_id: project._id }).populate(
          "other_party_id",
          "party_name",
        ),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        project,
        assignments: {
          team_members,
          contractors,
          vendors,
          suppliers,
          other_parties,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/projects
 * Creates a new project scoped to the tenant.
 */
const create = async (req, res, next) => {
  try {
    const { project_name } = req.body;

    // Duplicate name check per tenant
    const exists = await Project.findOne({
      user_id: req.user._id,
      project_name: project_name.trim(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { project_name: "A project with this name already exists." },
      });
    }

    const project = await Project.create({
      user_id: req.user._id,
      ...req.body,
      project_name: project_name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: { project },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/projects/:id
 * Updates project fields.
 */
const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    // Duplicate name check if being changed
    if (
      req.body.project_name &&
      req.body.project_name.trim() !== project.project_name
    ) {
      const duplicate = await Project.findOne({
        user_id: req.user._id,
        project_name: req.body.project_name.trim(),
        _id: { $ne: project._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: { project_name: "A project with this name already exists." },
        });
      }
    }

    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(project, safeBody);
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: { project },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/projects/:id
 * Soft delete — sets active: false.
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    project.active = false;
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
