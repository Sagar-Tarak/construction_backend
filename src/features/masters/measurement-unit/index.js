const MeasurementUnit = require("./measurement-unit.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(MeasurementUnit, "Measurement Unit", "unit_name");

module.exports = { MeasurementUnit, router };
