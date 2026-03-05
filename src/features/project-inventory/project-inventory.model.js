const mongoose = require("mongoose");

const projectInventorySchema = new mongoose.Schema(
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
    current_quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

projectInventorySchema.index({ user_id: 1, project_id: 1, item_id: 1 }, { unique: true });
projectInventorySchema.index({ user_id: 1, project_id: 1 });

module.exports = mongoose.model("ProjectInventory", projectInventorySchema);
