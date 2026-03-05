const Joi = require("joi");

const projectStatusSchema = Joi.object({
  status_name: Joi.string().trim().required().label("Status Name"),
});

const createProjectStatusSchema = projectStatusSchema;
const updateProjectStatusSchema = projectStatusSchema.min(1);

module.exports = { createProjectStatusSchema, updateProjectStatusSchema };
