const mongoose = require("mongoose");

/**
 * purchase_order_item
 * total_amount is auto-calculated:
 *   line_total = quantity × unit_rate
 *   after_discount = line_total - (line_total × discount / 100)
 *   gst_amount = after_discount × gst_rate / 100
 *   total_amount = after_discount + gst_amount
 */
const purchaseOrderItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchase_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
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
    unit_rate: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    gst_rate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GstRate",
      default: null,
    },
    gst_rate_value: {
      type: Number,
      default: 0, // snapshot of gst % at time of PO creation
    },
    total_amount: {
      type: Number,
      default: 0, // auto-calculated
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

purchaseOrderItemSchema.index({ purchase_order_id: 1 });
purchaseOrderItemSchema.index({ user_id: 1 });

module.exports = mongoose.model("PurchaseOrderItem", purchaseOrderItemSchema);
