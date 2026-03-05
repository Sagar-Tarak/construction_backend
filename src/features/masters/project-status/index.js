const ProjectStatus = require("./project-status.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(ProjectStatus, "Project Status", "status_name");

module.exports = { ProjectStatus, router };
