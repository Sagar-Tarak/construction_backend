const mongoose = require("mongoose");

const contractorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contractor_name: {
      type: String,
      required: true,
      trim: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    contact_person: {
      type: String,
      trim: true,
      default: null,
    },
    contact_number: {
      type: String,
      trim: true,
      default: null,
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
  },
  { timestamps: true },
);

contractorSchema.index({ user_id: 1 });
contractorSchema.index({ user_id: 1, contractor_name: 1 }, { unique: true });

module.exports = mongoose.model("Contractor", contractorSchema);
