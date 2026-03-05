const mongoose = require("mongoose");
const ProjectTeamMember = require("./project-team-member.model");
const ProjectContractor = require("./project-contractor.model");
const ProjectVendor = require("./project-vendor.model");
const ProjectSupplier = require("./project-supplier.model");
const ProjectOtherParty = require("./project-other-party.model");
const Project = require("../project.model");

/**
 * Assignment config map
 * Defines model, foreign key field, and populate path per assignment type.
 * Keeps all 5 assignment handlers DRY — one set of functions handles all types.
 */
const ASSIGNMENT_CONFIG = {
  "team-members": {
    Model: ProjectTeamMember,
    field: "team_member_id",
    ref: "TeamMember",
    populate: {
      path: "team_member_id",
      select: "user_name user_email designation_id",
    },
    extraFields: ["role_on_project", "joining_date"],
  },
  contractors: {
    Model: ProjectContractor,
    field: "contractor_id",
    ref: "Contractor",
    populate: {
      path: "contractor_id",
      select: "contractor_name contact_number",
    },
    extraFields: ["work_scope", "joining_date"],
  },
  vendors: {
    Model: ProjectVendor,
    field: "vendor_id",
    ref: "Vendor",
    populate: { path: "vendor_id", select: "vendor_name address" },
    extraFields: [
      "contact_number",
      "address",
      "vendor_photo",
      "other_documents",
      "joining_date",
    ],
  },
  suppliers: {
    Model: ProjectSupplier,
    field: "supplier_id",
    ref: "Supplier",
    populate: {
      path: "supplier_id",
      select: "supplier_name supplier_email supplier_number",
    },
    extraFields: ["purchase_order_ref", "joining_date"],
  },
  "other-parties": {
    Model: ProjectOtherParty,
    field: "other_party_id",
    ref: "OtherParty",
    populate: { path: "other_party_id", select: "party_name" },
    extraFields: ["role", "joining_date"],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const getConfig = (type) => ASSIGNMENT_CONFIG[type];

const validateProjectAccess = async (project_id, user_id) => {
  if (!mongoose.Types.ObjectId.isValid(project_id)) return null;
  return Project.findOne({ _id: project_id, user_id, active: true });
};

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/projects/:id/team-members (or contractors, vendors etc.)
 * Lists all assignments of a given type for a project.
 */
const getAssignments = (type) => async (req, res, next) => {
  try {
    const config = getConfig(type);
    if (!config)
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment type." });

    const project = await validateProjectAccess(req.params.id, req.user._id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const assignments = await config.Model.find({
      project_id: project._id,
      user_id: req.user._id,
    }).populate(config.populate);

    return res.status(200).json({ success: true, data: { assignments } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/projects/:id/team-members (or contractors, vendors etc.)
 * Assigns an entity to the project.
 * Prevents duplicate assignments via unique index on (project_id + entity_id).
 */
const addAssignment = (type) => async (req, res, next) => {
  try {
    const config = getConfig(type);
    if (!config)
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment type." });

    const project = await validateProjectAccess(req.params.id, req.user._id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const entityId = req.body[config.field];
    if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(422).json({
        success: false,
        errors: {
          [config.field]: `${config.field} is required and must be a valid ID.`,
        },
      });
    }

    // Check duplicate assignment
    const exists = await config.Model.findOne({
      project_id: project._id,
      [config.field]: entityId,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: `This ${config.ref} is already assigned to this project.`,
      });
    }

    // Build assignment doc — pick only allowed extra fields from body
    const assignmentData = {
      user_id: req.user._id,
      project_id: project._id,
      [config.field]: entityId,
    };

    config.extraFields.forEach((f) => {
      if (req.body[f] !== undefined) assignmentData[f] = req.body[f];
    });

    const assignment = await config.Model.create(assignmentData);
    await assignment.populate(config.populate);

    return res.status(201).json({
      success: true,
      message: `${config.ref} assigned to project successfully.`,
      data: { assignment },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/projects/:id/team-members/:entityId (or contractors/:contractorId etc.)
 * Removes an assignment from the project.
 */
const removeAssignment = (type) => async (req, res, next) => {
  try {
    const config = getConfig(type);
    if (!config)
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment type." });

    const project = await validateProjectAccess(req.params.id, req.user._id);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found." });
    }

    const entityId = req.params.entityId;
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const assignment = await config.Model.findOneAndDelete({
      project_id: project._id,
      [config.field]: entityId,
      user_id: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `${config.ref} assignment not found on this project.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${config.ref} removed from project successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAssignments, addAssignment, removeAssignment };
