const mongoose = require("mongoose");

const projectTeamMemberSchema = new mongoose.Schema(
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
    team_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
    role_on_project: {
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

// Prevent duplicate assignment of same member to same project
projectTeamMemberSchema.index(
  { project_id: 1, team_member_id: 1 },
  { unique: true },
);
projectTeamMemberSchema.index({ user_id: 1 });
projectTeamMemberSchema.index({ project_id: 1 });
projectTeamMemberSchema.index({ team_member_id: 1 }); // used by getAssignedProjects

module.exports = mongoose.model("ProjectTeamMember", projectTeamMemberSchema);
