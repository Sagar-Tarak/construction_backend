const mongoose = require("mongoose");
const ProjectInventory = require("./project-inventory.model");
const ProjectInventoryTransaction = require("./project-inventory-transaction.model");

/**
 * GET /api/project-inventory
 * List inventory for the authenticated user.
 * Supports ?project_id= filter to scope to one project.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };

    if (req.query.project_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.project_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid project_id." });
      }
      filter.project_id = req.query.project_id;
    }

    const inventory = await ProjectInventory.find(filter)
      .populate("project_id", "project_name")
      .populate("item_id", "material_name specification")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: { inventory } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/project-inventory/:id
 * Get a single inventory record by its _id.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const record = await ProjectInventory.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    })
      .populate("project_id", "project_name")
      .populate("item_id", "material_name specification");

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory record not found." });
    }

    return res.status(200).json({ success: true, data: { record } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/project-inventory/:id/transactions
 * List all transactions for a specific inventory record.
 */
const getTransactions = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const record = await ProjectInventory.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory record not found." });
    }

    const transactions = await ProjectInventoryTransaction.find({
      user_id: req.user._id,
      project_id: record.project_id,
      item_id: record.item_id,
    })
      .populate("material_transfer_id", "transfer_no")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: { transactions } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, getTransactions };
