const mongoose = require("mongoose");

const projectContractorSchema = new mongoose.Schema(
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
    contractor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      required: true,
    },
    work_scope: {
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

projectContractorSchema.index(
  { project_id: 1, contractor_id: 1 },
  { unique: true },
);
projectContractorSchema.index({ user_id: 1 });
projectContractorSchema.index({ project_id: 1 });
projectContractorSchema.index({ contractor_id: 1 }); // used by contractor softDelete ref check

module.exports = mongoose.model("ProjectContractor", projectContractorSchema);
