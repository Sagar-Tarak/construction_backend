const mongoose = require("mongoose");

const purchaseRequestItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchase_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequest",
      required: true,
    },
    material_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialCategory",
      default: null,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    measurement_unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementUnit",
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

purchaseRequestItemSchema.index({ purchase_request_id: 1 });
purchaseRequestItemSchema.index({ user_id: 1 });

module.exports = mongoose.model(
  "PurchaseRequestItem",
  purchaseRequestItemSchema,
);
