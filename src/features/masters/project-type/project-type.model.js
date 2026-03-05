const mongoose = require("mongoose");

const projectTypeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_type_name: {
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

projectTypeSchema.index({ user_id: 1 });
projectTypeSchema.index({ user_id: 1, project_type_name: 1 }, { unique: true });

module.exports = mongoose.model("ProjectType", projectTypeSchema);
