const mongoose = require("mongoose");
const Vendor = require("./vendor.model");

// ── Vendor CRUD ──────────────────────────────────────────────────────────────

const getAll = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({
      user_id: req.user._id,
      active: true,
    })
      .select("-shifts") // exclude shifts on list — use GET /:id or GET /:id/shifts
      .sort({ vendor_name: 1 });

    return res.status(200).json({ success: true, data: { vendors } });
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    return res.status(200).json({ success: true, data: { vendor } });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { vendor_name, address, gst_number, pan_number } = req.body;

    const exists = await Vendor.findOne({
      user_id: req.user._id,
      vendor_name: vendor_name.trim(),
    });
    if (exists) {
      return res.status(409).json({
        success: false,
        errors: { vendor_name: "A vendor with this name already exists." },
      });
    }

    const vendor = await Vendor.create({
      user_id: req.user._id,
      vendor_name: vendor_name.trim(),
      address: address || null,
      gst_number: gst_number || null,
      pan_number: pan_number || null,
      shifts: [],
    });

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully.",
      data: { vendor },
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

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    if (req.body.vendor_name && req.body.vendor_name.trim() !== vendor.vendor_name) {
      const duplicate = await Vendor.findOne({
        user_id: req.user._id,
        vendor_name: req.body.vendor_name.trim(),
        _id: { $ne: vendor._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: { vendor_name: "A vendor with this name already exists." },
        });
      }
    }

    // Never overwrite shifts via vendor update — shifts have own endpoints
    const { user_id: _removed, shifts: _ignored, ...safeBody } = req.body;
    Object.assign(vendor, safeBody);
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Vendor updated successfully.",
      data: { vendor },
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

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    // Reference protection — check if assigned to any active project
    try {
      const ProjectVendor = require("../project/project-vendor.model");
      const inUse = await ProjectVendor.exists({ vendor_id: vendor._id });
      if (inUse) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete. This vendor is assigned to one or more projects. Remove those assignments first.",
        });
      }
    } catch (_) {
      // Project feature not yet loaded — skip reference check
    }

    vendor.active = false;
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Vendor deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

// ── Shift handlers ───────────────────────────────────────────────────────────

/**
 * GET /api/vendors/:id/shifts
 * Returns all active shifts for a vendor.
 */
const getShifts = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vendor ID." });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    const shifts = vendor.shifts.filter((s) => s.active);

    return res.status(200).json({ success: true, data: { shifts } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/vendors/:id/shifts
 * Adds a new shift to the vendor.
 * Duplicate check: one active shift per labour_category_id per vendor.
 */
const addShift = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid vendor ID." });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    const {
      labour_category_id,
      shift_start_time,
      shift_end_time,
      rate_per_day,
      overtime_wage_per_hour,
    } = req.body;

    // Check duplicate: only one active shift per labour_category_id per vendor
    const shiftExists = vendor.shifts.some(
      (s) =>
        s.labour_category_id.toString() === labour_category_id && s.active,
    );
    if (shiftExists) {
      return res.status(409).json({
        success: false,
        errors: {
          labour_category_id:
            "An active shift for this labour category already exists for this vendor.",
        },
      });
    }

    vendor.shifts.push({
      labour_category_id,
      shift_start_time,
      shift_end_time,
      rate_per_day: rate_per_day ?? null,
      overtime_wage_per_hour: overtime_wage_per_hour ?? null,
    });
    await vendor.save();

    const newShift = vendor.shifts[vendor.shifts.length - 1];

    return res.status(201).json({
      success: true,
      message: "Shift added successfully.",
      data: { shift: newShift },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/vendors/:id/shifts/:shiftId
 * Updates an existing shift.
 */
const updateShift = async (req, res, next) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.shiftId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    const shift = vendor.shifts.id(req.params.shiftId);
    if (!shift) {
      return res
        .status(404)
        .json({ success: false, message: "Shift not found." });
    }

    // Check duplicate labour_category_id if being changed
    if (
      req.body.labour_category_id &&
      req.body.labour_category_id !== shift.labour_category_id.toString()
    ) {
      const duplicate = vendor.shifts.some(
        (s) =>
          s._id.toString() !== shift._id.toString() &&
          s.labour_category_id.toString() === req.body.labour_category_id &&
          s.active,
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          errors: {
            labour_category_id:
              "An active shift for this labour category already exists for this vendor.",
          },
        });
      }
    }

    const {
      labour_category_id,
      shift_start_time,
      shift_end_time,
      rate_per_day,
      overtime_wage_per_hour,
      active,
    } = req.body;

    if (labour_category_id !== undefined) shift.labour_category_id = labour_category_id;
    if (shift_start_time !== undefined) shift.shift_start_time = shift_start_time;
    if (shift_end_time !== undefined) shift.shift_end_time = shift_end_time;
    if (rate_per_day !== undefined) shift.rate_per_day = rate_per_day;
    if (overtime_wage_per_hour !== undefined) shift.overtime_wage_per_hour = overtime_wage_per_hour;
    if (active !== undefined) shift.active = active;

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Shift updated successfully.",
      data: { shift },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/vendors/:id/shifts/:shiftId
 * Deactivates a shift — sets active: false.
 */
const deactivateShift = async (req, res, next) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.shiftId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found." });
    }

    const shift = vendor.shifts.id(req.params.shiftId);
    if (!shift) {
      return res
        .status(404)
        .json({ success: false, message: "Shift not found." });
    }

    shift.active = false;
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Shift deactivated successfully.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  softDelete,
  getShifts,
  addShift,
  updateShift,
  deactivateShift,
};
