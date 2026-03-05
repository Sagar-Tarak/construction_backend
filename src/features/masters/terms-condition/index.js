const TermsCondition = require("./terms-condition.model");
const createLookupRouter = require("../shared/generic.routes");

const router = createLookupRouter(TermsCondition, "Terms & Condition", "term_condition_name");

module.exports = { TermsCondition, router };
