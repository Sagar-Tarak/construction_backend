const mongoose = require("mongoose");

const projectVendorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
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
    vendor_photo: {
      type: String, // file path / URL
      default: null,
    },
    other_documents: {
      type: String, // file path / URL
      default: null,
    },
    joining_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectVendorSchema.index({ project_id: 1, vendor_id: 1 }, { unique: true });
projectVendorSchema.index({ user_id: 1 });
projectVendorSchema.index({ project_id: 1 });
projectVendorSchema.index({ vendor_id: 1 }); // used by vendor softDelete ref check

module.exports = mongoose.model("ProjectVendor", projectVendorSchema);
