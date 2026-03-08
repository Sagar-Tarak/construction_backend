const mongoose = require("mongoose");

// Full audit trail of every stock movement at store level
// transaction_type values:
//   "in"           — stock arrived via materials_received item
//   "transfer_in"  — stock received from another store (same project)
//   "transfer_out" — stock sent to another store (same project)
// NOTE: "out" (consumption) is NOT used — consumption is out of scope
const storeTransactionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectStore",
      required: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    transaction_type: {
      type: String,
      enum: ["in", "transfer_in", "transfer_out"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    materials_received_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialsReceived",
      default: null,
    },
    transfer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreMaterialTransfer",
      default: null,
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    remark: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StoreTransaction", storeTransactionSchema);
