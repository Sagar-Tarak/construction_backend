const mongoose = require("mongoose");

/**
 * purchase_request
 * Status flow: "pending" → "approved" | "rejected"
 * PR number auto-generated: PR-YYYY-XXXX (year-based sequence per tenant)
 */
const purchaseRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purchase_request_no: {
      type: String,
      required: true,
      trim: true,
    },
    purchase_request_date: {
      type: Date,
      required: true,
    },
    location_type: {
      type: String,
      trim: true,
      default: null,
    },
    required_date: {
      type: Date,
      default: null,
    },
    remark: {
      type: String,
      trim: true,
      default: null,
    },
    document: {
      type: String, // file path / URL
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Set when approved/rejected
    actioned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    actioned_at: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

// Primary tenant index
purchaseRequestSchema.index({ user_id: 1 });

// Unique PR number per tenant
purchaseRequestSchema.index(
  { user_id: 1, purchase_request_no: 1 },
  { unique: true },
);

// Status filter — used heavily in list views
purchaseRequestSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
