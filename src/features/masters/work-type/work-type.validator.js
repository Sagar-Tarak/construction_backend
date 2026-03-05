const Joi = require("joi");

const workTypeSchema = Joi.object({
  work_type_name: Joi.string().trim().required().label("Work Type Name"),
  department_id: Joi.string().required().label("Department"),
});

const createWorkTypeSchema = workTypeSchema;
const updateWorkTypeSchema = workTypeSchema.min(1);

module.exports = { createWorkTypeSchema, updateWorkTypeSchema };
