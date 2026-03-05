const mongoose = require("mongoose");

const projectOtherPartySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    other_party_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OtherParty",
      required: true,
    },
    role: {
      type: String,
      trim: true,
      default: null,
    },
    joining_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

projectOtherPartySchema.index(
  { project_id: 1, other_party_id: 1 },
  { unique: true },
);
projectOtherPartySchema.index({ user_id: 1 });
projectOtherPartySchema.index({ project_id: 1 });

module.exports = mongoose.model("ProjectOtherParty", projectOtherPartySchema);
