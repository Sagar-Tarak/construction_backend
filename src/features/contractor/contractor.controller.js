const mongoose = require("mongoose");
const Contractor = require("./contractor.model");

const getAll = async (req, res, next) => {
  try {
    const contractors = await Contractor.find({
      user_id: req.user._id,
      active: true,
    }).sort({ contractor_name: 1 });

    return res.status(200).json({ success: true, data: { contractors } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const contractor = await Contractor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!contractor) {
      return res
        .status(404)
        .json({ success: false, message: "Contractor not found." });
    }

    return res.status(200).json({ success: true, data: { contractor } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      contractor_name,
      department_id,
      contact_person,
      contact_number,
      address,
      gst_number,
      pan_number,
    } = req.body;

    const exists = await Contractor.findOne({
      user_id: req.user._id,
      contractor_name: contractor_name.trim(),
    });
    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { contractor_name: "A contractor with this name already exists." },
      });
    }

    const contractor = await Contractor.create({
      user_id: req.user._id,
      contractor_name: contractor_name.trim(),
      department_id: department_id || null,
      contact_person: contact_person || null,
      contact_number: contact_number || null,
      address: address || null,
      gst_number: gst_number || null,
      pan_number: pan_number || null,
    });

    return res.status(201).json({
      success: true,
      message: "Contractor created successfully.",
      data: { contractor },
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

    const contractor = await Contractor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!contractor) {
      return res
        .status(404)
        .json({ success: false, message: "Contractor not found." });
    }

    // Check duplicate contractor_name if being changed
    if (
      req.body.contractor_name &&
      req.body.contractor_name.trim() !== contractor.contractor_name
    ) {
      const duplicate = await Contractor.findOne({
        user_id: req.user._id,
        contractor_name: req.body.contractor_name.trim(),
        _id: { $ne: contractor._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: { contractor_name: "A contractor with this name already exists." },
        });
      }
    }

    const { user_id: _removed, ...safeBody } = req.body;
    Object.assign(contractor, safeBody);
    await contractor.save();

    return res.status(200).json({
      success: true,
      message: "Contractor updated successfully.",
      data: { contractor },
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

    const contractor = await Contractor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!contractor) {
      return res
        .status(404)
        .json({ success: false, message: "Contractor not found." });
    }

    // Reference protection — check if assigned to any active project
    try {
      const ProjectContractor = require("../project/project-contractor.model");
      const inUse = await ProjectContractor.exists({
        contractor_id: contractor._id,
      });
      if (inUse) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete. This contractor is assigned to one or more projects. Remove those assignments first.",
        });
      }
    } catch (_) {
      // Project feature not yet loaded — skip reference check
    }

    contractor.active = false;
    await contractor.save();

    return res.status(200).json({
      success: true,
      message: "Contractor deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, softDelete };
