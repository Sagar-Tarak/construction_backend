const mongoose = require("mongoose");

const workTypeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    work_type_name: {
      type: String,
      required: true,
      trim: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

workTypeSchema.index({ user_id: 1 });
workTypeSchema.index({ user_id: 1, work_type_name: 1 }, { unique: true });

module.exports = mongoose.model("WorkType", workTypeSchema);
