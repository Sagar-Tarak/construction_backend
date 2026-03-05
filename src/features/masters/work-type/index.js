const WorkType = require("./work-type.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(WorkType, "Work Type", "work_type_name");

module.exports = { WorkType, router };
