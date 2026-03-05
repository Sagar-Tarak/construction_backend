const mongoose = require("mongoose");

/**
 * project
 * Core entity — scoped by user_id.
 * Referenced by almost every other feature in the app.
 */
const projectSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project_name: {
      type: String,
      required: true,
      trim: true,
    },
    project_start_date: {
      type: Date,
      default: null,
    },
    expected_completion_date: {
      type: Date,
      default: null,
    },
    project_address: {
      type: String,
      trim: true,
      default: null,
    },
    project_status_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectStatus",
      default: null,
    },
    project_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectType",
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Primary tenant index (spec §1.2)
projectSchema.index({ user_id: 1 });
projectSchema.index({ user_id: 1, active: 1 }); // spec §1.2 compound index

module.exports = mongoose.model("Project", projectSchema);
