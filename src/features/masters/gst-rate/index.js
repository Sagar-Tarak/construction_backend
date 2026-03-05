const GstRate = require("./gst-rate.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(GstRate, "GST Rate", "gst_rate");

module.exports = { GstRate, router };
