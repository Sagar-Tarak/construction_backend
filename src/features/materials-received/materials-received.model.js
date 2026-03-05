const mongoose = require("mongoose");

/**
 * materials_received
 * Status flow: "partial" → "completed"
 * MR number auto-generated: MR-YYYY-XXXX (year-based per tenant)
 *
 * When created — auto triggers project inventory update (transaction "in")
 * References PO by purchase_order_no (string ref per DB design)
 */
const materialsReceivedSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    materials_received_no: {
      type: String,
      required: true,
      trim: true,
    },
    received_date: {
      type: Date,
      required: true,
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    // String ref to purchase_order.purchase_order_no (per DB design)
    purchase_order_no: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["partial", "completed"],
      default: "partial",
    },
    invoice_number: {
      type: String,
      trim: true,
      default: null,
    },
    invoice_date: {
      type: Date,
      default: null,
    },
    total_invoice_amount: {
      type: Number,
      default: null,
    },
    location_type: {
      type: String,
      trim: true,
      default: null,
    },
    unloading_location: {
      type: String,
      trim: true,
      default: null,
    },
    vehicle_no: {
      type: String,
      trim: true,
      default: null,
    },
    delivery_challan_number: {
      type: String,
      trim: true,
      default: null,
    },
    payment_term: {
      type: String,
      trim: true,
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
    documents: {
      type: String, // file path / URL
      default: null,
    },
  },
  { timestamps: true },
);

materialsReceivedSchema.index({ user_id: 1 });
materialsReceivedSchema.index(
  { user_id: 1, materials_received_no: 1 },
  { unique: true },
);
materialsReceivedSchema.index({ user_id: 1, status: 1 });
materialsReceivedSchema.index({ user_id: 1, purchase_order_no: 1 });

module.exports = mongoose.model("MaterialsReceived", materialsReceivedSchema);
