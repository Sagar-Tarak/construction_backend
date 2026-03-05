const mongoose = require("mongoose");
const MaterialTransfer = require("./material-transfer.model");
const MaterialTransferItem = require("./material-transfer-item.model");
const ProjectInventory = require("../project-inventory/project-inventory.model");
const ProjectInventoryTransaction = require("../project-inventory/project-inventory-transaction.model");

// ── Transfer Number Generator ────────────────────────────────────────────────

const generateTransferNo = async (user_id) => {
  const year = new Date().getFullYear();
  const prefix = `TR-${year}-`;

  const latest = await MaterialTransfer.findOne({
    user_id,
    transfer_no: { $regex: `^${prefix}` },
  })
    .sort({ transfer_no: -1 })
    .select("transfer_no");

  let sequence = 1;
  if (latest) {
    const parts = latest.transfer_no.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

// ── Inventory Helpers ────────────────────────────────────────────────────────

/**
 * Deducts stock from source project for each item.
 * Called on CREATE.
 * Validates sufficient stock exists for ALL items before deducting any (all-or-nothing).
 * Returns { success, error } so controller can return 400 cleanly.
 */
const deductSourceInventory = async ({
  user_id,
  from_project_id,
  transfer_id,
  transferred_by,
  items,
}) => {
  // ── Step 1: validate ALL items have sufficient stock before touching anything
  for (const item of items) {
    const inv = await ProjectInventory.findOne({
      user_id,
      project_id: from_project_id,
      item_id: item.item_id,
    });

    if (!inv || inv.current_quantity < item.quantity) {
      const available = inv?.current_quantity ?? 0;
      return {
        success: false,
        error: `Insufficient stock for item ${item.item_id}. Available: ${available}, Requested: ${item.quantity}.`,
      };
    }
  }

  // ── Step 2: all checks passed — deduct and record transactions
  for (const item of items) {
    await ProjectInventory.findOneAndUpdate(
      { user_id, project_id: from_project_id, item_id: item.item_id },
      { $inc: { current_quantity: -item.quantity } },
    );

    await ProjectInventoryTransaction.create({
      user_id,
      project_id: from_project_id,
      item_id: item.item_id,
      transaction_type: "transfer_out",
      quantity: item.quantity,
      material_transfer_id: transfer_id,
      performed_by: transferred_by || null,
      remark: item.remark || null,
    });
  }

  return { success: true };
};

/**
 * Adds stock to destination project for each item.
 * Called on RECEIVE.
 */
const addDestinationInventory = async ({
  user_id,
  to_project_id,
  transfer_id,
  received_by,
  items,
}) => {
  for (const item of items) {
    await ProjectInventory.findOneAndUpdate(
      { user_id, project_id: to_project_id, item_id: item.item_id },
      {
        $inc: { current_quantity: item.quantity },
        $setOnInsert: {
          user_id,
          project_id: to_project_id,
          item_id: item.item_id,
        },
      },
      { upsert: true, new: true },
    );

    await ProjectInventoryTransaction.create({
      user_id,
      project_id: to_project_id,
      item_id: item.item_id,
      transaction_type: "transfer_in",
      quantity: item.quantity,
      material_transfer_id: transfer_id,
      performed_by: received_by || null,
      remark: item.remark || null,
    });
  }
};

/**
 * Reverses source deduction.
 * Called on CANCEL — restores stock to source project.
 */
const reverseSourceInventory = async ({
  user_id,
  from_project_id,
  transfer_id,
  items,
}) => {
  for (const item of items) {
    await ProjectInventory.findOneAndUpdate(
      { user_id, project_id: from_project_id, item_id: item.item_id },
      { $inc: { current_quantity: item.quantity } },
    );
  }

  // Delete the transfer_out transactions for this transfer
  await ProjectInventoryTransaction.deleteMany({
    user_id,
    material_transfer_id: transfer_id,
    transaction_type: "transfer_out",
  });
};

// ── Populate helper ──────────────────────────────────────────────────────────

const populateTransfer = (query) =>
  query
    .populate("from_project_id", "project_name")
    .populate("to_project_id", "project_name")
    .populate("transferred_by", "user_name user_email")
    .populate("received_by", "user_name user_email");

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/material-transfers
 * Supports ?status=, ?from_project_id=, ?to_project_id= filters.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };

    if (req.query.status) {
      if (!["pending", "received", "cancelled"].includes(req.query.status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status." });
      }
      filter.status = req.query.status;
    }

    if (req.query.from_project_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.from_project_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid from_project_id." });
      }
      filter.from_project_id = req.query.from_project_id;
    }

    if (req.query.to_project_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.to_project_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid to_project_id." });
      }
      filter.to_project_id = req.query.to_project_id;
    }

    const transfers = await populateTransfer(
      MaterialTransfer.find(filter).sort({ createdAt: -1 }),
    );

    return res.status(200).json({ success: true, data: { transfers } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/material-transfers/:id
 * Returns transfer with all line items.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await populateTransfer(
      MaterialTransfer.findOne({ _id: req.params.id, user_id: req.user._id }),
    );

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Material transfer not found." });
    }

    const items = await MaterialTransferItem.find({
      material_transfer_id: transfer._id,
    }).populate("item_id", "material_name specification");

    return res.status(200).json({ success: true, data: { transfer, items } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/material-transfers
 * Creates transfer + deducts source inventory immediately.
 * Validates:
 *   - from and to projects are different
 *   - all items have sufficient stock in source project
 */
const create = async (req, res, next) => {
  try {
    const {
      transfer_date,
      from_project_id,
      to_project_id,
      transferred_by,
      remark,
      documents,
      items,
    } = req.body;

    // Cannot transfer to same project
    if (from_project_id === to_project_id) {
      return res.status(400).json({
        success: false,
        message: "Source and destination projects cannot be the same.",
      });
    }

    const transfer_no = await generateTransferNo(req.user._id);

    const transfer = await MaterialTransfer.create({
      user_id: req.user._id,
      transfer_no,
      transfer_date,
      from_project_id,
      to_project_id,
      transferred_by: transferred_by || null,
      remark: remark || null,
      documents: documents || null,
    });

    // Create line items
    const itemDocs = items.map((item) => ({
      user_id: req.user._id,
      material_transfer_id: transfer._id,
      item_id: item.item_id,
      quantity: item.quantity,
      remark: item.remark || null,
    }));

    await MaterialTransferItem.insertMany(itemDocs);

    // Deduct from source — validates stock first (all-or-nothing)
    const deductResult = await deductSourceInventory({
      user_id: req.user._id,
      from_project_id,
      transfer_id: transfer._id,
      transferred_by: transferred_by || null,
      items,
    });

    if (!deductResult.success) {
      // Roll back — delete transfer and items
      await MaterialTransferItem.deleteMany({
        material_transfer_id: transfer._id,
      });
      await transfer.deleteOne();

      return res.status(400).json({
        success: false,
        message: deductResult.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: `Transfer ${transfer_no} created. Stock deducted from source project.`,
      data: { transfer },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/material-transfers/:id/receive
 * Confirms receipt at destination.
 * Adds stock to destination project inventory.
 * Only valid when status is "pending".
 */
const receiveTransfer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await MaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Material transfer not found." });
    }

    if (transfer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot receive a transfer with status '${transfer.status}'.`,
      });
    }

    const { received_by, received_date } = req.body;

    // Get items to update destination inventory
    const items = await MaterialTransferItem.find({
      material_transfer_id: transfer._id,
    });

    // Add to destination project
    await addDestinationInventory({
      user_id: req.user._id,
      to_project_id: transfer.to_project_id,
      transfer_id: transfer._id,
      received_by: received_by || null,
      items,
    });

    transfer.status = "received";
    transfer.received_by = received_by || null;
    transfer.received_date = received_date;
    await transfer.save();

    return res.status(200).json({
      success: true,
      message: "Transfer received. Destination project inventory updated.",
      data: { transfer },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/material-transfers/:id/cancel
 * Cancels a pending transfer.
 * Reverses the source deduction — restores stock.
 * Cannot cancel a received transfer.
 */
const cancelTransfer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await MaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Material transfer not found." });
    }

    if (transfer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a transfer with status '${transfer.status}'.`,
      });
    }

    const items = await MaterialTransferItem.find({
      material_transfer_id: transfer._id,
    });

    // Reverse source deduction
    await reverseSourceInventory({
      user_id: req.user._id,
      from_project_id: transfer.from_project_id,
      transfer_id: transfer._id,
      items,
    });

    transfer.status = "cancelled";
    await transfer.save();

    return res.status(200).json({
      success: true,
      message: "Transfer cancelled. Source project inventory restored.",
      data: { transfer },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/material-transfers/:id
 * Only deletable when status is "cancelled".
 * Pending and received transfers cannot be hard deleted.
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await MaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Material transfer not found." });
    }

    if (transfer.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Only cancelled transfers can be deleted. Current status: '${transfer.status}'. Cancel it first.`,
      });
    }

    await MaterialTransferItem.deleteMany({
      material_transfer_id: transfer._id,
    });
    await transfer.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Material transfer deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  receiveTransfer,
  cancelTransfer,
  softDelete,
};
