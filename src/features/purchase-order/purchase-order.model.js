const mongoose = require("mongoose");

/**
 * purchase_order
 * Status flow: "draft" → "sent" → "acknowledged" → "completed" | "cancelled"
 * PO number auto-generated: PO-YYYY-XXXX (year-based sequence per tenant)
 * References purchase_request by purchase_request_no (string ref per DB design)
 */
const purchaseOrderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchase_order_no: {
      type: String,
      required: true,
      trim: true,
    },
    purchase_order_date: {
      type: Date,
      required: true,
    },
    // String ref to purchase_request.purchase_request_no (per DB design)
    purchase_request_no: {
      type: String,
      required: true,
      trim: true,
    },
    location_type: {
      type: String,
      trim: true,
      default: null,
    },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    expected_delivery_date: {
      type: Date,
      required: true,
    },
    delivery_address: {
      type: String,
      trim: true,
      default: null,
    },
    contact_person_name: {
      type: String,
      trim: true,
      default: null,
    },
    additional_charges: {
      type: Number,
      default: 0,
    },
    deduction_amount: {
      type: Number,
      default: 0,
    },
    payment_term: {
      type: String,
      trim: true,
      default: null,
    },
    terms_condition_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TermsCondition",
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "acknowledged", "completed", "cancelled"],
      default: "draft",
    },

    // Computed totals — stored for fast retrieval
    subtotal: { type: Number, default: 0 }, // sum of all item totals before charges
    grand_total: { type: Number, default: 0 }, // subtotal + additional_charges - deduction_amount
  },
  { timestamps: true },
);

purchaseOrderSchema.index({ user_id: 1 });
purchaseOrderSchema.index(
  { user_id: 1, purchase_order_no: 1 },
  { unique: true },
);
purchaseOrderSchema.index({ user_id: 1, status: 1 });
purchaseOrderSchema.index({ user_id: 1, purchase_request_no: 1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
