const mongoose = require("mongoose");
const StoreMaterialTransfer = require("./store-material-transfer.model");
const StoreMaterialTransferItem = require("./store-material-transfer-item.model");
const {
  ProjectStore,
  StoreInventory,
  StoreTransaction,
} = require("../project-store");

// ─── GENERATE TRANSFER NUMBER ─────────────────────────────────────────────────
const generateTransferNo = async (userId) => {
  const year = new Date().getFullYear();
  const prefix = `TR-${year}-`;
  const last = await StoreMaterialTransfer.findOne(
    { user_id: userId, transfer_no: { $regex: `^${prefix}` } },
    {},
    { sort: { createdAt: -1 } },
  );
  if (!last) return `${prefix}0001`;
  const lastNum = parseInt(last.transfer_no.split("-")[2], 10);
  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
};

// ─── DEDUCT FROM SOURCE STORE ──────────────────────────────────────────────────
// Validates ALL items have sufficient stock BEFORE deducting any
// Returns { success: true } or { success: false, error: string }
const deductSourceStore = async (
  userId,
  projectId,
  fromStoreId,
  transferId,
  items,
) => {
  // PASS 1 — validate all stock levels
  for (const item of items) {
    const inv = await StoreInventory.findOne({
      store_id: fromStoreId,
      item_id: item.item_id,
      user_id: userId,
    });
    const available = inv ? inv.current_quantity : 0;
    if (available < item.quantity) {
      const itemDoc = await mongoose
        .model("Item")
        .findById(item.item_id)
        .select("material_name");
      const name = itemDoc ? itemDoc.material_name : item.item_id;
      return {
        success: false,
        error: `Insufficient stock for "${name}". Available: ${available}, Requested: ${item.quantity}`,
      };
    }
  }

  // PASS 2 — deduct and record transactions
  for (const item of items) {
    await StoreInventory.findOneAndUpdate(
      { store_id: fromStoreId, item_id: item.item_id, user_id: userId },
      { $inc: { current_quantity: -item.quantity } },
    );

    await StoreTransaction.create({
      user_id: userId,
      store_id: fromStoreId,
      project_id: projectId,
      item_id: item.item_id,
      transaction_type: "transfer_out",
      quantity: item.quantity,
      transfer_id: transferId,
    });
  }

  return { success: true };
};

// ─── CREDIT DESTINATION STORE ──────────────────────────────────────────────────
const creditDestinationStore = async (
  userId,
  projectId,
  toStoreId,
  transferId,
  items,
) => {
  for (const item of items) {
    await StoreInventory.findOneAndUpdate(
      { store_id: toStoreId, item_id: item.item_id, user_id: userId },
      {
        $inc: { current_quantity: item.quantity },
        $setOnInsert: { project_id: projectId },
      },
      { upsert: true, new: true },
    );

    await StoreTransaction.create({
      user_id: userId,
      store_id: toStoreId,
      project_id: projectId,
      item_id: item.item_id,
      transaction_type: "transfer_in",
      quantity: item.quantity,
      transfer_id: transferId,
    });
  }
};

// ─── REVERSE SOURCE STORE (on cancel) ─────────────────────────────────────────
const reverseSourceStore = async (userId, fromStoreId, transferId, items) => {
  for (const item of items) {
    await StoreInventory.findOneAndUpdate(
      { store_id: fromStoreId, item_id: item.item_id, user_id: userId },
      { $inc: { current_quantity: item.quantity } },
    );
  }
  // Delete transfer_out transactions for clean history
  await StoreTransaction.deleteMany({
    transfer_id: transferId,
    transaction_type: "transfer_out",
  });
};

// ─── CREATE TRANSFER ──────────────────────────────────────────────────────────
const createTransfer = async (req, res, next) => {
  try {
    const { project_id, from_store_id, to_store_id, items, ...rest } = req.body;

    // Must be different stores
    if (from_store_id === to_store_id) {
      return res.status(400).json({
        success: false,
        message: "Source and destination stores must be different.",
      });
    }

    // Both stores must belong to the same project
    const [fromStore, toStore] = await Promise.all([
      ProjectStore.findOne({
        _id: from_store_id,
        project_id,
        user_id: req.user._id,
        active: true,
      }),
      ProjectStore.findOne({
        _id: to_store_id,
        project_id,
        user_id: req.user._id,
        active: true,
      }),
    ]);

    if (!fromStore) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Source store not found in this project.",
        });
    }
    if (!toStore) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Destination store not found in this project.",
        });
    }

    const transfer_no = await generateTransferNo(req.user._id);

    const transfer = await StoreMaterialTransfer.create({
      user_id: req.user._id,
      transfer_no,
      project_id,
      from_store_id,
      to_store_id,
      ...rest,
    });

    const transferItems = await StoreMaterialTransferItem.insertMany(
      items.map((item) => ({
        user_id: req.user._id,
        transfer_id: transfer._id,
        item_id: item.item_id,
        quantity: item.quantity,
        remark: item.remark || null,
      })),
    );

    // Deduct from source store immediately
    const deductResult = await deductSourceStore(
      req.user._id,
      project_id,
      from_store_id,
      transfer._id,
      items,
    );

    if (!deductResult.success) {
      // Rollback — delete transfer and items
      await StoreMaterialTransfer.deleteOne({ _id: transfer._id });
      await StoreMaterialTransferItem.deleteMany({ transfer_id: transfer._id });
      return res
        .status(400)
        .json({ success: false, message: deductResult.error });
    }

    return res.status(201).json({
      success: true,
      data: { ...transfer.toObject(), items: transferItems },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL TRANSFERS ────────────────────────────────────────────────────────
const getAllTransfers = async (req, res, next) => {
  try {
    const filter = { user_id: req.user._id };
    if (req.query.project_id) filter.project_id = req.query.project_id;
    if (req.query.status) filter.status = req.query.status;

    const transfers = await StoreMaterialTransfer.find(filter)
      .populate("from_store_id", "store_name")
      .populate("to_store_id", "store_name")
      .populate("project_id", "project_name")
      .populate("transferred_by", "user_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: transfers });
  } catch (err) {
    next(err);
  }
};

// ─── GET ONE TRANSFER ─────────────────────────────────────────────────────────
const getTransferById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await StoreMaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    })
      .populate("from_store_id", "store_name location")
      .populate("to_store_id", "store_name location")
      .populate("project_id", "project_name")
      .populate("transferred_by", "user_name")
      .populate("received_by", "user_name");

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found." });
    }

    const items = await StoreMaterialTransferItem.find({
      transfer_id: transfer._id,
    }).populate("item_id", "material_name specification");

    return res
      .status(200)
      .json({ success: true, data: { ...transfer.toObject(), items } });
  } catch (err) {
    next(err);
  }
};

// ─── RECEIVE TRANSFER ─────────────────────────────────────────────────────────
const receiveTransfer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await StoreMaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found." });
    }
    if (transfer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot receive a transfer with status "${transfer.status}". Only pending transfers can be received.`,
      });
    }

    const items = await StoreMaterialTransferItem.find({
      transfer_id: transfer._id,
    });

    await creditDestinationStore(
      req.user._id,
      transfer.project_id,
      transfer.to_store_id,
      transfer._id,
      items,
    );

    transfer.status = "received";
    transfer.received_by = req.body.received_by || null;
    transfer.received_date = req.body.received_date;
    if (req.body.remark) transfer.remark = req.body.remark;
    await transfer.save();

    return res.status(200).json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

// ─── CANCEL TRANSFER ──────────────────────────────────────────────────────────
const cancelTransfer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await StoreMaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found." });
    }
    if (transfer.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a transfer with status "${transfer.status}". Only pending transfers can be cancelled.`,
      });
    }

    const items = await StoreMaterialTransferItem.find({
      transfer_id: transfer._id,
    });

    await reverseSourceStore(
      req.user._id,
      transfer.from_store_id,
      transfer._id,
      items,
    );

    transfer.status = "cancelled";
    await transfer.save();

    return res
      .status(200)
      .json({
        success: true,
        message: "Transfer cancelled. Stock restored.",
        data: transfer,
      });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE TRANSFER ──────────────────────────────────────────────────────────
// Only allowed when status is "cancelled"
const deleteTransfer = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const transfer = await StoreMaterialTransfer.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!transfer) {
      return res
        .status(404)
        .json({ success: false, message: "Transfer not found." });
    }
    if (transfer.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message:
          "Only cancelled transfers can be deleted. Cancel the transfer first.",
      });
    }

    await StoreMaterialTransferItem.deleteMany({ transfer_id: transfer._id });
    await StoreMaterialTransfer.deleteOne({ _id: transfer._id });

    return res
      .status(200)
      .json({ success: true, message: "Transfer deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransfer,
  getAllTransfers,
  getTransferById,
  receiveTransfer,
  cancelTransfer,
  deleteTransfer,
};
