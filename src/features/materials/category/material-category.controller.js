const mongoose = require("mongoose");
const MaterialCategory = require("./material-category.model");

const getAll = async (req, res, next) => {
  try {
    const categories = await MaterialCategory.find({
      user_id: req.user._id,
      active: true,
    }).sort({ material_category_name: 1 });

    return res.status(200).json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const category = await MaterialCategory.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Material category not found." });
    }

    return res.status(200).json({ success: true, data: { category } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { material_category_name } = req.body;

    const exists = await MaterialCategory.findOne({
      user_id: req.user._id,
      material_category_name: material_category_name.trim(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        errors: {
          material_category_name:
            "A material category with this name already exists.",
        },
      });
    }

    const category = await MaterialCategory.create({
      user_id: req.user._id,
      material_category_name: material_category_name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Material category created successfully.",
      data: { category },
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

    const category = await MaterialCategory.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Material category not found." });
    }

    if (
      req.body.material_category_name &&
      req.body.material_category_name.trim() !== category.material_category_name
    ) {
      const duplicate = await MaterialCategory.findOne({
        user_id: req.user._id,
        material_category_name: req.body.material_category_name.trim(),
        _id: { $ne: category._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: {
            material_category_name:
              "A material category with this name already exists.",
          },
        });
      }
    }

    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(category, safeBody);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Material category updated successfully.",
      data: { category },
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

    const category = await MaterialCategory.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Material category not found." });
    }

    // Reference protection — check if any active material uses this category
    const Material = require("../material.model");
    const inUse = await Material.exists({
      user_id: req.user._id,
      material_category_id: category._id,
      active: true,
    });

    if (inUse) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete. One or more active materials are using this category. Remove those materials first.",
      });
    }

    category.active = false;
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Material category deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
