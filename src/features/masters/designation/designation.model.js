const mongoose = require("mongoose");

const designationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    designation_name: {
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

designationSchema.index({ user_id: 1 });
designationSchema.index({ user_id: 1, designation_name: 1 }, { unique: true });

module.exports = mongoose.model("Designation", designationSchema);
