const mongoose = require("mongoose");

const gstRateSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gst_rate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

gstRateSchema.index({ user_id: 1 });
gstRateSchema.index({ user_id: 1, gst_rate: 1 }, { unique: true });

module.exports = mongoose.model("GstRate", gstRateSchema);
