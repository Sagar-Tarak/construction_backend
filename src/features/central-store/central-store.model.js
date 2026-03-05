const mongoose = require("mongoose");

const centralStoreSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store_name: {
      type: String,
      required: true,
      trim: true,
    },
    store_address: {
      type: String,
      required: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

centralStoreSchema.index({ user_id: 1 });
centralStoreSchema.index({ user_id: 1, store_name: 1 }, { unique: true });

module.exports = mongoose.model("CentralStore", centralStoreSchema);
