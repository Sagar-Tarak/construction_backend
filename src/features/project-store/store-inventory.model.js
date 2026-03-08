const mongoose = require("mongoose");

// One record per item per store — live stock balance
// Never written to manually — always updated via store transactions
const storeInventorySchema = new mongoose.Schema(
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
    current_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

storeInventorySchema.index({ store_id: 1, item_id: 1 }, { unique: true });

module.exports = mongoose.model("StoreInventory", storeInventorySchema);
