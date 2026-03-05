const Joi = require("joi");

const measurementUnitSchema = Joi.object({
  unit_name: Joi.string().trim().required().label("Unit Name"),
});

const createMeasurementUnitSchema = measurementUnitSchema;
const updateMeasurementUnitSchema = measurementUnitSchema.min(1);

module.exports = { createMeasurementUnitSchema, updateMeasurementUnitSchema };
