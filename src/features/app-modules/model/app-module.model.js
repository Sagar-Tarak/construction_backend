const mongoose = require("mongoose");

const appModuleSchema = new mongoose.Schema(
  {
    module_name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    module_group: {
      type: String,
      trim: true,
    },
    available_permissions: {
      type: [String],
      enum: [
        "add",
        "view",
        "edit",
        "delete",
        "approve",
        "reject",
        "download",
        "report",
        "view_all",
        "notification",
        "transfer",
      ],
      default: [],
    },
    sort_order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AppModule", appModuleSchema);
