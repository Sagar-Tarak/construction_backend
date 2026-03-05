const ProjectType = require("./project-type.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(ProjectType, "Project Type", "project_type_name");

module.exports = { ProjectType, router };
