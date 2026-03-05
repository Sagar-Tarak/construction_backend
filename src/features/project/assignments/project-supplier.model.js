const mongoose = require("mongoose");

const projectSupplierSchema = new mongoose.Schema(
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
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    purchase_order_ref: {
      type: String,
      trim: true,
      default: null,
    },
    joining_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectSupplierSchema.index(
  { project_id: 1, supplier_id: 1 },
  { unique: true },
);
projectSupplierSchema.index({ user_id: 1 });
projectSupplierSchema.index({ project_id: 1 });
projectSupplierSchema.index({ supplier_id: 1 }); // used by supplier softDelete ref check

module.exports = mongoose.model("ProjectSupplier", projectSupplierSchema);
