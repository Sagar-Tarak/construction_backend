const mongoose = require("mongoose");
const Supplier = require("./supplier.model");

const getAll = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({
      user_id: req.user._id,
      active: true,
    }).sort({ supplier_name: 1 });

    return res.status(200).json({ success: true, data: { suppliers } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found." });
    }

    return res.status(200).json({ success: true, data: { supplier } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      supplier_name,
      contact_person,
      supplier_email,
      supplier_number,
      address,
      gst_number,
      pan_number,
    } = req.body;

    const exists = await Supplier.findOne({
      user_id: req.user._id,
      supplier_name: supplier_name.trim(),
    });
    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { supplier_name: "A supplier with this name already exists." },
      });
    }

    const supplier = await Supplier.create({
      user_id: req.user._id,
      supplier_name: supplier_name.trim(),
      contact_person: contact_person || null,
      supplier_email: supplier_email || null,
      supplier_number: supplier_number || null,
      address: address || null,
      gst_number: gst_number || null,
      pan_number: pan_number || null,
    });

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully.",
      data: { supplier },
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

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found." });
    }

    if (
      req.body.supplier_name &&
      req.body.supplier_name.trim() !== supplier.supplier_name
    ) {
      const duplicate = await Supplier.findOne({
        user_id: req.user._id,
        supplier_name: req.body.supplier_name.trim(),
        _id: { $ne: supplier._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: { supplier_name: "A supplier with this name already exists." },
        });
      }
    }

    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(supplier, safeBody);
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully.",
      data: { supplier },
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

    const supplier = await Supplier.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found." });
    }

    // Reference protection — check if assigned to any active project
    try {
      const ProjectSupplier = require("../project/assignments/project-supplier.model");
      const inProject = await ProjectSupplier.exists({ supplier_id: supplier._id });
      if (inProject) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete. This supplier is assigned to one or more projects. Remove those assignments first.",
        });
      }
    } catch (_) {}

    // Reference protection — check if assigned to any central store
    try {
      const CentralStoreSupplier = require("../central-store/assigments/central-store-supplier.model");
      const inStore = await CentralStoreSupplier.exists({ supplier_id: supplier._id });
      if (inStore) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete. This supplier is assigned to one or more central stores. Remove those assignments first.",
        });
      }
    } catch (_) {}

    // Reference protection — check if referenced by any purchase order
    try {
      const PurchaseOrder = require("../purchase-order/purchase-order.model");
      const inPO = await PurchaseOrder.exists({
        user_id: req.user._id,
        supplier_id: supplier._id,
      });
      if (inPO) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete. This supplier is referenced by one or more purchase orders.",
        });
      }
    } catch (_) {}

    supplier.active = false;
    await supplier.save();

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
