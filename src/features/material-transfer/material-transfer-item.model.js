const mongoose = require("mongoose");

const materialTransferItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    material_transfer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialTransfer",
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
    remark: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

materialTransferItemSchema.index({ material_transfer_id: 1 });
materialTransferItemSchema.index({ user_id: 1 });

module.exports = mongoose.model(
  "MaterialTransferItem",
  materialTransferItemSchema,
);
