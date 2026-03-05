const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplier_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_person: {
      type: String,
      trim: true,
      default: null,
    },
    supplier_email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    supplier_number: {
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

supplierSchema.index({ user_id: 1 });
supplierSchema.index({ user_id: 1, supplier_name: 1 }, { unique: true });

module.exports = mongoose.model("Supplier", supplierSchema);
