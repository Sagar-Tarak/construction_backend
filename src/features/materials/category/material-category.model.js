const mongoose = require("mongoose");

const materialCategorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    material_category_name: {
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

materialCategorySchema.index({ user_id: 1 });
materialCategorySchema.index(
  { user_id: 1, material_category_name: 1 },
  { unique: true },
);

module.exports = mongoose.model("MaterialCategory", materialCategorySchema);
