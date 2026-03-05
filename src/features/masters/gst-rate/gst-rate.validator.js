const Joi = require("joi");

const gstRateSchema = Joi.object({
  gst_rate: Joi.number().min(0).max(100).required().label("GST Rate (%)"),
});

const createGstRateSchema = gstRateSchema;
const updateGstRateSchema = gstRateSchema.min(1);

module.exports = { createGstRateSchema, updateGstRateSchema };
