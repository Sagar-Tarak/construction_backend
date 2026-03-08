const mongoose = require("mongoose");
const ProjectStore = require("./project-store.model");
const StoreInventory = require("./store-inventory.model");
const StoreTransaction = require("./store-transaction.model");

// ─── CREATE STORE ─────────────────────────────────────────────────────────────
const createStore = async (req, res, next) => {
  try {
    const { project_id, store_name, location, store_manager_id } = req.body;

    const duplicate = await ProjectStore.findOne({
      project_id,
      store_name: store_name.trim(),
      active: true,
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A store with this name already exists in this project.",
      });
    }

    const store = await ProjectStore.create({
      user_id: req.user._id,
      project_id,
      store_name: store_name.trim(),
      location: location || null,
      store_manager_id: store_manager_id || null,
    });

    return res.status(201).json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

// ─── GET ALL STORES FOR A PROJECT ─────────────────────────────────────────────
const getStoresByProject = async (req, res, next) => {
  try {
    const { project_id } = req.query;

    if (!project_id || !mongoose.Types.ObjectId.isValid(project_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid project_id query parameter is required.",
      });
    }

    const stores = await ProjectStore.find({
      user_id: req.user._id,
      project_id,
      active: true,
    }).populate("store_manager_id", "user_name mobile_number");

    return res.status(200).json({ success: true, data: stores });
  } catch (err) {
    next(err);
  }
};

// ─── GET ONE STORE ─────────────────────────────────────────────────────────────
const getStoreById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store ID." });
    }

    const store = await ProjectStore.findOne({
      _id: req.params.id,
      user_id: req.user._id,
      active: true,
    })
      .populate("store_manager_id", "user_name mobile_number")
      .populate("project_id", "project_name");

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    }

    return res.status(200).json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE STORE ──────────────────────────────────────────────────────────────
const updateStore = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store ID." });
    }

    const store = await ProjectStore.findOne({
      _id: req.params.id,
      user_id: req.user._id,
      active: true,
    });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    }

    // Check duplicate name if store_name is being changed
    if (
      req.body.store_name &&
      req.body.store_name.trim() !== store.store_name
    ) {
      const duplicate = await ProjectStore.findOne({
        project_id: store.project_id,
        store_name: req.body.store_name.trim(),
        active: true,
        _id: { $ne: store._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A store with this name already exists in this project.",
        });
      }
    }

    const { project_id, user_id, ...updates } = req.body;
    Object.assign(store, updates);
    await store.save();

    return res.status(200).json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

// ─── SOFT DELETE STORE ─────────────────────────────────────────────────────────
const deleteStore = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store ID." });
    }

    const store = await ProjectStore.findOne({
      _id: req.params.id,
      user_id: req.user._id,
      active: true,
    });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found." });
    }

    // Block delete if store has any stock
    const hasStock = await StoreInventory.findOne({
      store_id: store._id,
      current_quantity: { $gt: 0 },
    });
    if (hasStock) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete. This store still has stock. Transfer or clear stock first.",
      });
    }

    store.active = false;
    await store.save();

    return res
      .status(200)
      .json({ success: true, message: "Store deleted successfully." });
  } catch (err) {
    next(err);
  }
};

// ─── GET STORE INVENTORY ───────────────────────────────────────────────────────
// Returns all items and their stock levels for a single store
const getStoreInventory = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store ID." });
    }

    const inventory = await StoreInventory.find({
      store_id: req.params.id,
      user_id: req.user._id,
    }).populate({
      path: "item_id",
      select: "material_name specification minimum_quantity",
      populate: [
        { path: "measurement_unit_id", select: "unit_name" },
        { path: "material_category_id", select: "material_category_name" },
      ],
    });

    return res.status(200).json({ success: true, data: inventory });
  } catch (err) {
    next(err);
  }
};

// ─── GET PROJECT INVENTORY SUMMARY ────────────────────────────────────────────
// Returns combined stock across all stores for a project
// Groups by item, shows per-store breakdown + total
const getProjectInventorySummary = async (req, res, next) => {
  try {
    const { project_id } = req.query;

    if (!project_id || !mongoose.Types.ObjectId.isValid(project_id)) {
      return res.status(400).json({
        success: false,
        message: "Valid project_id query parameter is required.",
      });
    }

    // Get all stores for this project
    const stores = await ProjectStore.find({
      project_id,
      user_id: req.user._id,
      active: true,
    }).select("_id store_name");

    if (!stores.length) {
      return res.status(200).json({ success: true, data: [], stores: [] });
    }

    const storeIds = stores.map((s) => s._id);

    // Get all inventory records for these stores
    const inventory = await StoreInventory.find({
      store_id: { $in: storeIds },
      user_id: req.user._id,
    }).populate({
      path: "item_id",
      select: "material_name specification minimum_quantity",
      populate: { path: "measurement_unit_id", select: "unit_name" },
    });

    // Build summary: group by item
    const summaryMap = {};

    for (const record of inventory) {
      const itemId = record.item_id._id.toString();

      if (!summaryMap[itemId]) {
        summaryMap[itemId] = {
          item: record.item_id,
          total_quantity: 0,
          by_store: {},
        };
      }

      summaryMap[itemId].total_quantity = parseFloat(
        (summaryMap[itemId].total_quantity + record.current_quantity).toFixed(
          4,
        ),
      );

      summaryMap[itemId].by_store[record.store_id.toString()] =
        record.current_quantity;
    }

    return res.status(200).json({
      success: true,
      stores,
      data: Object.values(summaryMap),
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET STORE TRANSACTIONS ────────────────────────────────────────────────────
const getStoreTransactions = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid store ID." });
    }

    const transactions = await StoreTransaction.find({
      store_id: req.params.id,
      user_id: req.user._id,
    })
      .populate("item_id", "material_name")
      .populate("performed_by", "user_name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
};

// ─── GET LOW STOCK STORES ──────────────────────────────────────────────────────
// Returns all store+item combos where current_quantity < item.minimum_quantity
const getLowStock = async (req, res, next) => {
  try {
    const { project_id } = req.query;
    const filter = { user_id: req.user._id };

    if (project_id) {
      if (!mongoose.Types.ObjectId.isValid(project_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid project_id." });
      }
      filter.project_id = project_id;
    }

    const inventory = await StoreInventory.find(filter)
      .populate({
        path: "item_id",
        select: "material_name minimum_quantity",
        populate: { path: "measurement_unit_id", select: "unit_name" },
      })
      .populate("store_id", "store_name project_id");

    const lowStock = inventory.filter(
      (rec) =>
        rec.item_id &&
        rec.item_id.minimum_quantity > 0 &&
        rec.current_quantity < rec.item_id.minimum_quantity,
    );

    return res.status(200).json({ success: true, data: lowStock });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStore,
  getStoresByProject,
  getStoreById,
  updateStore,
  deleteStore,
  getStoreInventory,
  getProjectInventorySummary,
  getStoreTransactions,
  getLowStock,
};
