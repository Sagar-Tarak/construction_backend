const projectRoutes = require("./project.routes");
const Project = require("./project.model");
const ProjectTeamMember = require("./assignments/project-team-member.model");
const ProjectContractor = require("./assignments/project-contractor.model");
const ProjectVendor = require("./assignments/project-vendor.model");
const ProjectSupplier = require("./assignments/project-supplier.model");
const ProjectOtherParty = require("./assignments/project-other-party.model");

module.exports = {
  projectRoutes,
  Project,
  ProjectTeamMember,
  ProjectContractor,
  ProjectVendor,
  ProjectSupplier,
  ProjectOtherParty,
};
