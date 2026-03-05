const mongoose = require("mongoose");

const measurementUnitSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    unit_name: {
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

measurementUnitSchema.index({ user_id: 1 });
measurementUnitSchema.index({ user_id: 1, unit_name: 1 }, { unique: true });

module.exports = mongoose.model("MeasurementUnit", measurementUnitSchema);
