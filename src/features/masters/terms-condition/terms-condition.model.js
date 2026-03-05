const mongoose = require("mongoose");

const termsConditionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    term_condition_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

termsConditionSchema.index({ user_id: 1 });
termsConditionSchema.index({ user_id: 1, term_condition_name: 1 }, { unique: true });

module.exports = mongoose.model("TermsCondition", termsConditionSchema);
