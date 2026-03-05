const mongoose = require("mongoose");

const projectInventoryTransactionSchema = new mongoose.Schema(
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
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: true,
    },
    transaction_type: {
      type: String,
      required: true,
      enum: ["transfer_in", "transfer_out", "received", "issued"],
    },
    quantity: {
      type: Number,
      required: true,
    },
    material_transfer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialTransfer",
    },
    performed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remark: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

projectInventoryTransactionSchema.index({ user_id: 1, project_id: 1 });
projectInventoryTransactionSchema.index({ material_transfer_id: 1 });

module.exports = mongoose.model("ProjectInventoryTransaction", projectInventoryTransactionSchema);
