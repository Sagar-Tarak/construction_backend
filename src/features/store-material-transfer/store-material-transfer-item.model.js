const mongoose = require("mongoose");

const storeMaterialTransferItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transfer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreMaterialTransfer",
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    remark: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "StoreMaterialTransferItem",
  storeMaterialTransferItemSchema,
);
