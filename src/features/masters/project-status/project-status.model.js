const mongoose = require("mongoose");

const projectStatusSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status_name: {
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

projectStatusSchema.index({ user_id: 1 });
projectStatusSchema.index({ user_id: 1, status_name: 1 }, { unique: true });

module.exports = mongoose.model("ProjectStatus", projectStatusSchema);
