const LabourCategory = require("./labour-category.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(LabourCategory, "Labour Category", "category_name");

module.exports = { LabourCategory, router };
