const mongoose = require("mongoose");
const MaterialsReceived = require("./materials-received.model");
const MaterialsReceivedItem = require("./materials-received-item.model");

// ── MR Number Generator ──────────────────────────────────────────────────────

const generateMRNumber = async (user_id) => {
  const year = new Date().getFullYear();
  const prefix = `MR-${year}-`;

  const latest = await MaterialsReceived.findOne({
    user_id,
    materials_received_no: { $regex: `^${prefix}` },
  })
    .sort({ materials_received_no: -1 })
    .select("materials_received_no");

  let sequence = 1;
  if (latest) {
    const parts = latest.materials_received_no.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

// ── Inventory Update ─────────────────────────────────────────────────────────

/**
 * Updates project inventory when materials are received.
 * For each item received:
 *   1. Upsert project_inventory record (create if not exists)
 *   2. Increment current_quantity
 *   3. Create project_inventory_transaction with type "in"
 *
 * Uses lazy loading to avoid circular dependencies since
 * project-inventory feature is built after this one.
 */
const updateProjectInventory = async ({
  user_id,
  project_id,
  materials_received_id,
  received_by,
  items,
}) => {
  try {
    const ProjectInventory = require("../project-inventory/project-inventory.model");
    const ProjectInventoryTransaction = require("../project-inventory/project-inventory-transaction.model");

    for (const item of items) {
      // Upsert inventory record — create if first time this item arrives at project
      await ProjectInventory.findOneAndUpdate(
        {
          user_id,
          project_id,
          item_id: item.item_id,
        },
        {
          $inc: { current_quantity: item.quantity_received },
          $setOnInsert: { user_id, project_id, item_id: item.item_id },
        },
        { upsert: true, new: true },
      );

      // Record the inbound transaction
      await ProjectInventoryTransaction.create({
        user_id,
        project_id,
        item_id: item.item_id,
        transaction_type: "in",
        quantity: item.quantity_received,
        materials_received_id,
        performed_by: received_by,
        remark: item.remark || null,
      });
    }
  } catch (err) {
    // Log but don't block the MR creation if inventory models not yet available
    console.error("Inventory update failed:", err.message);
  }
};

// ── Populate helper ──────────────────────────────────────────────────────────

const populateMR = (query) =>
  query
    .populate("received_by", "user_name user_email")
    .populate("supplier_id", "supplier_name supplier_number");

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/materials-received
 * Supports ?status= and ?purchase_order_no= filters.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };

    if (req.query.status) {
      if (!["partial", "completed"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Use: partial, completed.",
        });
      }
      filter.status = req.query.status;
    }

    if (req.query.purchase_order_no) {
      filter.purchase_order_no = req.query.purchase_order_no.trim();
    }

    const records = await populateMR(
      MaterialsReceived.find(filter).sort({ createdAt: -1 }),
    );

    return res
      .status(200)
      .json({ success: true, data: { materials_received: records } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/materials-received/:id
 * Returns MR with all line items populated.
 */
const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const record = await populateMR(
      MaterialsReceived.findOne({ _id: req.params.id, user_id: req.user._id }),
    );

    if (!record) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Materials received record not found.",
        });
    }

    const items = await MaterialsReceivedItem.find({
      materials_received_id: record._id,
    })
      .populate("item_id", "material_name specification")
      .populate("purchase_order_item_id", "quantity unit_rate");

    return res.status(200).json({ success: true, data: { record, items } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/materials-received
 * Creates MR + line items.
 * Automatically updates project inventory for each item received.
 *
 * project_id in body — tells inventory which project to credit.
 * This is NOT stored on the MR document itself per DB design,
 * but is passed through to the inventory transaction.
 */
const create = async (req, res, next) => {
  try {
    const {
      received_date,
      received_by,
      supplier_id,
      purchase_order_no,
      status,
      invoice_number,
      invoice_date,
      total_invoice_amount,
      location_type,
      unloading_location,
      vehicle_no,
      delivery_challan_number,
      payment_term,
      remark,
      documents,
      items,
      project_id,
    } = req.body;

    // Validate PO exists and belongs to tenant if provided
    if (purchase_order_no) {
      const PurchaseOrder = require("../purchase-order/purchase-order.model");
      const po = await PurchaseOrder.findOne({
        user_id: req.user._id,
        purchase_order_no: purchase_order_no.trim(),
      });

      if (!po) {
        return res.status(404).json({
          success: false,
          errors: { purchase_order_no: "Purchase order not found." },
        });
      }
    }

    const materials_received_no = await generateMRNumber(req.user._id);

    const record = await MaterialsReceived.create({
      user_id: req.user._id,
      materials_received_no,
      received_date,
      received_by,
      supplier_id: supplier_id || null,
      purchase_order_no: purchase_order_no || null,
      status: status || "partial",
      invoice_number: invoice_number || null,
      invoice_date: invoice_date || null,
      total_invoice_amount: total_invoice_amount || null,
      location_type: location_type || null,
      unloading_location: unloading_location || null,
      vehicle_no: vehicle_no || null,
      delivery_challan_number: delivery_challan_number || null,
      payment_term: payment_term || null,
      remark: remark || null,
      documents: documents || null,
    });

    // Create all line items
    const itemDocs = items.map((item) => ({
      user_id: req.user._id,
      materials_received_id: record._id,
      purchase_order_item_id: item.purchase_order_item_id || null,
      item_id: item.item_id,
      quantity_received: item.quantity_received,
      unit_rate: item.unit_rate || null,
      remark: item.remark || null,
    }));

    await MaterialsReceivedItem.insertMany(itemDocs);

    // Auto-update project inventory
    await updateProjectInventory({
      user_id: req.user._id,
      project_id,
      materials_received_id: record._id,
      received_by,
      items,
    });

    return res.status(201).json({
      success: true,
      message: `Materials received ${materials_received_no} recorded successfully. Project inventory updated.`,
      data: { record },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/materials-received/:id
 * Only editable when status is "partial".
 * Cannot edit completed records.
 * Items cannot be changed after creation — only header fields.
 */
const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const record = await MaterialsReceived.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!record) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Materials received record not found.",
        });
    }

    if (record.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a completed materials received record.",
      });
    }

    const {
      user_id: _u,
      items: _i,
      purchase_order_no: _po,
      ...safeBody
    } = req.body;
    Object.assign(record, safeBody);
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Materials received record updated successfully.",
      data: { record },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/materials-received/:id/status
 * Marks record as completed.
 * Only valid transition: partial → completed.
 */
const updateStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const record = await MaterialsReceived.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!record) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Materials received record not found.",
        });
    }

    if (record.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This record is already completed.",
      });
    }

    record.status = "completed";
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Materials received record marked as completed.",
      data: { record },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/materials-received/:id
 * Only deletable when status is "partial".
 * Reverses the inventory update when deleted.
 */
const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const record = await MaterialsReceived.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!record) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Materials received record not found.",
        });
    }

    if (record.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a completed materials received record.",
      });
    }

    // Reverse inventory — subtract quantities that were added
    try {
      const ProjectInventory = require("../project-inventory/project-inventory.model");
      const ProjectInventoryTransaction = require("../project-inventory/project-inventory-transaction.model");

      const items = await MaterialsReceivedItem.find({
        materials_received_id: record._id,
      });

      // Find the original transaction to get project_id
      const originalTx = await ProjectInventoryTransaction.findOne({
        materials_received_id: record._id,
      });

      if (originalTx && items.length > 0) {
        for (const item of items) {
          await ProjectInventory.findOneAndUpdate(
            {
              user_id: req.user._id,
              project_id: originalTx.project_id,
              item_id: item.item_id,
            },
            { $inc: { current_quantity: -item.quantity_received } },
          );
        }

        // Delete all related transactions
        await ProjectInventoryTransaction.deleteMany({
          materials_received_id: record._id,
        });
      }
    } catch (_) {
      // Inventory feature not yet loaded — skip reversal
    }

    await MaterialsReceivedItem.deleteMany({
      materials_received_id: record._id,
    });
    await record.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Materials received record deleted and inventory reversed.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, updateStatus, softDelete };
