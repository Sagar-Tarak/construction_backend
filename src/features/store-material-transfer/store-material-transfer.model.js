const mongoose = require("mongoose");

// Status flow:
//   pending   — initiated, from_store stock deducted immediately
//   received  — to_store confirmed receipt, to_store stock credited
//   cancelled — cancelled before receipt, from_store stock restored
const storeMaterialTransferSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transfer_no: {
      type: String,
      required: true,
      unique: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    from_store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectStore",
      required: true,
    },
    to_store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectStore",
      required: true,
    },
    transfer_date: {
      type: Date,
      required: true,
    },
    transferred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    received_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "received", "cancelled"],
      default: "pending",
    },
    remark: {
      type: String,
      trim: true,
    },
    documents: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "StoreMaterialTransfer",
  storeMaterialTransferSchema,
);
