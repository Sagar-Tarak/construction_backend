const Department = require("./department.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(Department, "Department", "department_name");

module.exports = { Department, router };
