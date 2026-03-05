const mongoose = require("mongoose");
const CentralStore = require("../central-store.model");
const CentralStoreTeamMember = require("./central-store.team-member.model");
const CentralStoreSupplier = require("./central-store-supplier.model");

const ASSIGNMENT_CONFIG = {
  "team-members": {
    Model: CentralStoreTeamMember,
    field: "team_member_id",
    ref: "TeamMember",
    populate: { path: "team_member_id", select: "user_name user_email" },
  },
  suppliers: {
    Model: CentralStoreSupplier,
    field: "supplier_id",
    ref: "Supplier",
    populate: {
      path: "supplier_id",
      select: "supplier_name supplier_email supplier_number",
    },
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const validateStoreAccess = async (store_id, user_id) => {
  if (!mongoose.Types.ObjectId.isValid(store_id)) return null;
  return CentralStore.findOne({ _id: store_id, user_id, active: true });
};

// ── Controllers ──────────────────────────────────────────────────────────────

const getAssignments = (type) => async (req, res, next) => {
  try {
    const config = ASSIGNMENT_CONFIG[type];
    if (!config)
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment type." });

    const store = await validateStoreAccess(req.params.id, req.user._id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Central store not found." });

    const assignments = await config.Model.find({
      store_id: store._id,
      user_id: req.user._id,
    }).populate(config.populate);

    return res.status(200).json({ success: true, data: { assignments } });
  } catch (err) {
    next(err);
  }
};

const addAssignment = (type) => async (req, res, next) => {
  try {
    const config = ASSIGNMENT_CONFIG[type];
    if (!config)
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment type." });

    const store = await validateStoreAccess(req.params.id, req.user._id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Central store not found." });

    const entityId = req.body[config.field];
    if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(422).json({
        success: false,
        errors: {
          [config.field]: `${config.field} is required and must be a valid ID.`,
        },
      });
    }

    const exists = await config.Model.findOne({
      store_id: store._id,
      [config.field]: entityId,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: `This ${config.ref} is already assigned to this store.`,
      });
    }

    const assignment = await config.Model.create({
      user_id: req.user._id,
      store_id: store._id,
      [config.field]: entityId,
    });

    await assignment.populate(config.populate);

    return res.status(201).json({
      success: true,
      message: `${config.ref} assigned to store successfully.`,
      data: { assignment },
    });
  } catch (err) {
    next(err);
  }
};

const removeAssignment = (type) => async (req, res, next) => {
  try {
    const config = ASSIGNMENT_CONFIG[type];
    if (!config)
      return res
        .status(400)
        .json({ success: false, message: "Invalid assignment type." });

    const store = await validateStoreAccess(req.params.id, req.user._id);
    if (!store)
      return res
        .status(404)
        .json({ success: false, message: "Central store not found." });

    const entityId = req.params.entityId;
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const assignment = await config.Model.findOneAndDelete({
      store_id: store._id,
      [config.field]: entityId,
      user_id: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: `${config.ref} assignment not found on this store.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${config.ref} removed from store successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAssignments, addAssignment, removeAssignment };
