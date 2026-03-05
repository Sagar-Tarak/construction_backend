const mongoose = require("mongoose");

const labourCategorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category_name: {
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

labourCategorySchema.index({ user_id: 1 });
labourCategorySchema.index({ user_id: 1, category_name: 1 }, { unique: true });

module.exports = mongoose.model("LabourCategory", labourCategorySchema);
