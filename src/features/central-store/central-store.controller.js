const mongoose = require("mongoose");
const CentralStore = require("./central-store.model");
const CentralStoreTeamMember = require("./assigments/central-store.team-member.model");
const CentralStoreSupplier = require("./assigments/central-store-supplier.model");

const getAll = async (req, res, next) => {
  try {
    const stores = await CentralStore.find({
      user_id: req.user._id,
      active: true,
    }).sort({ store_name: 1 });

    return res.status(200).json({ success: true, data: { stores } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const store = await CentralStore.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Central store not found." });
    }

    // Fetch assignments in parallel
    const [team_members, suppliers] = await Promise.all([
      CentralStoreTeamMember.find({ store_id: store._id }).populate(
        "team_member_id",
        "user_name user_email",
      ),
      CentralStoreSupplier.find({ store_id: store._id }).populate(
        "supplier_id",
        "supplier_name supplier_email supplier_number",
      ),
    ]);

    return res.status(200).json({
      success: true,
      data: { store, assignments: { team_members, suppliers } },
    });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { store_name, store_address } = req.body;

    const exists = await CentralStore.findOne({
      user_id: req.user._id,
      store_name: store_name.trim(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        errors: {
          store_name: "A central store with this name already exists.",
        },
      });
    }

    const store = await CentralStore.create({
      user_id: req.user._id,
      store_name: store_name.trim(),
      store_address: store_address.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Central store created successfully.",
      data: { store },
    });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const store = await CentralStore.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Central store not found." });
    }

    if (
      req.body.store_name &&
      req.body.store_name.trim() !== store.store_name
    ) {
      const duplicate = await CentralStore.findOne({
        user_id: req.user._id,
        store_name: req.body.store_name.trim(),
        _id: { $ne: store._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: {
            store_name: "A central store with this name already exists.",
          },
        });
      }
    }

    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(store, safeBody);
    await store.save();

    return res.status(200).json({
      success: true,
      message: "Central store updated successfully.",
      data: { store },
    });
  } catch (err) {
    next(err);
  }
};

const softDelete = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const store = await CentralStore.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Central store not found." });
    }

    // Reference protection — check pending requests
    const CentralStoreRequest = require("./requests/central-store-request.model");
    const pendingRequests = await CentralStoreRequest.exists({
      store_id: store._id,
      status: "requested",
    });

    if (pendingRequests) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete. This store has pending material requests. Complete or delete them first.",
      });
    }

    store.active = false;
    await store.save();

    return res.status(200).json({
      success: true,
      message: "Central store deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
