const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department_name: {
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

departmentSchema.index({ user_id: 1 });
departmentSchema.index({ user_id: 1, department_name: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
