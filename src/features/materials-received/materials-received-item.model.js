const mongoose = require("mongoose");

/**
 * materials_received_item
 * Links received quantities back to PO items.
 * purchase_order_item_id allows tracking how much of each PO line has been received.
 */
const materialsReceivedItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    materials_received_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialsReceived",
      required: true,
    },
    purchase_order_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrderItem",
      default: null,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    quantity_received: {
      type: Number,
      required: true,
      min: 0.01,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectStore",
      required: true,
    },
    gst_rate_value: {
      type: Number,
      default: 0,
    },
    unit_rate: {
      type: Number,
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

materialsReceivedItemSchema.index({ materials_received_id: 1 });
materialsReceivedItemSchema.index({ user_id: 1 });
materialsReceivedItemSchema.index({ item_id: 1 }); // used by inventory lookup

module.exports = mongoose.model(
  "MaterialsReceivedItem",
  materialsReceivedItemSchema,
);
