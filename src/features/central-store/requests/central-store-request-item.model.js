const mongoose = require("mongoose");

const centralStoreRequestItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CentralStoreRequest",
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
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

centralStoreRequestItemSchema.index({ request_id: 1 });
centralStoreRequestItemSchema.index({ user_id: 1 });

module.exports = mongoose.model(
  "CentralStoreRequestItem",
  centralStoreRequestItemSchema,
);
