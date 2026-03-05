const mongoose = require("mongoose");

/**
 * Vendor shifts are stored as a subdocument array on the vendor.
 * Each shift tracks a labour category with its working hours and rates.
 * Duplicate check: one active shift per labour_category_id per vendor.
 */
const shiftSchema = new mongoose.Schema(
  {
    labour_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabourCategory",
      required: true,
    },
    shift_start_time: { type: String, required: true, trim: true }, // e.g. "08:00"
    shift_end_time: { type: String, required: true, trim: true },   // e.g. "17:00"
    rate_per_day: { type: Number, default: null },
    overtime_wage_per_hour: { type: Number, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const vendorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendor_name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    gst_number: {
      type: String,
      trim: true,
      default: null,
    },
    pan_number: {
      type: String,
      trim: true,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    shifts: [shiftSchema],
  },
  { timestamps: true },
);

vendorSchema.index({ user_id: 1 });
vendorSchema.index({ user_id: 1, vendor_name: 1 }, { unique: true });

module.exports = mongoose.model("Vendor", vendorSchema);
