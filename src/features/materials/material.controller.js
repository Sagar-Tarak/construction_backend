const mongoose = require("mongoose");
const Material = require("./material.model");

const getAll = async (req, res, next) => {
  try {
    const filter = {
      user_id: req.user._id,
      active: true,
    };

    // Optional category filter — GET /api/materials?category_id=xxx (spec §9)
    if (req.query.category_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.category_id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid category ID." });
      }
      filter.material_category_id = req.query.category_id;
    }

    const materials = await Material.find(filter)
      .populate("material_category_id", "material_category_name")
      .populate("measurement_unit_id", "unit_name")
      .populate("gst_rate_id", "gst_rate")
      .sort({ material_name: 1 });

    return res.status(200).json({ success: true, data: { materials } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const material = await Material.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    })
      .populate("material_category_id", "material_category_name")
      .populate("measurement_unit_id", "unit_name")
      .populate("gst_rate_id", "gst_rate");

    if (!material) {
      return res
        .status(404)
        .json({ success: false, message: "Material not found." });
    }

    return res.status(200).json({ success: true, data: { material } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { material_name } = req.body;

    // Duplicate name check per tenant
    const exists = await Material.findOne({
      user_id: req.user._id,
      material_name: material_name.trim(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { material_name: "A material with this name already exists." },
      });
    }

    const material = await Material.create({
      user_id: req.user._id, // always from token
      ...req.body,
      material_name: material_name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Material created successfully.",
      data: { material },
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

    const material = await Material.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!material) {
      return res
        .status(404)
        .json({ success: false, message: "Material not found." });
    }

    // Duplicate name check if being changed
    if (
      req.body.material_name &&
      req.body.material_name.trim() !== material.material_name
    ) {
      const duplicate = await Material.findOne({
        user_id: req.user._id,
        material_name: req.body.material_name.trim(),
        _id: { $ne: material._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: {
            material_name: "A material with this name already exists.",
          },
        });
      }
    }

    // Strip user_id — never allow overwrite via body
    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(material, safeBody);
    await material.save();

    return res.status(200).json({
      success: true,
      message: "Material updated successfully.",
      data: { material },
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

    const material = await Material.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!material) {
      return res
        .status(404)
        .json({ success: false, message: "Material not found." });
    }

    // Reference protection — check if used in any active inventory
    try {
      const ProjectInventory = require("../project-inventory/project-inventory.model");
      const inInventory = await ProjectInventory.exists({
        user_id: req.user._id,
        item_id: material._id,
      });
      if (inInventory) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete. This material exists in project inventory.",
        });
      }
    } catch (_) {
      // Project inventory not yet built — skip check
    }

    material.active = false;
    await material.save();

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
