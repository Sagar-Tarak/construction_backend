const Designation = require("./designation.model");
const createLookupRouter = require("../shared/generic.routes");

const getRouter = () => {
  const TeamMember = require("../../team-member/team-member.model");

  return createLookupRouter(Designation, "Designation", "designation_name", [
    { model: TeamMember, field: "designation_id", label: "Team Members" },
  ]);
};

module.exports = { Designation, getRouter };
