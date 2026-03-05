const mongoose = require("mongoose");

const centralStoreTeamMemberSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CentralStore",
      required: true,
    },
    team_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      required: true,
    },
  },
  { timestamps: true },
);

centralStoreTeamMemberSchema.index(
  { store_id: 1, team_member_id: 1 },
  { unique: true },
);
centralStoreTeamMemberSchema.index({ user_id: 1 });
centralStoreTeamMemberSchema.index({ store_id: 1 });

module.exports = mongoose.model(
  "CentralStoreTeamMember",
  centralStoreTeamMemberSchema,
);
