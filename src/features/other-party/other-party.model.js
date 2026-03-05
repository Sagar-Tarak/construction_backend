const mongoose = require("mongoose");

const otherPartySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    party_name: {
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

otherPartySchema.index({ user_id: 1 });
otherPartySchema.index({ user_id: 1, party_name: 1 }, { unique: true });

module.exports = mongoose.model("OtherParty", otherPartySchema);
