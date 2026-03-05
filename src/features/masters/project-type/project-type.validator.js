const Joi = require("joi");

const projectTypeSchema = Joi.object({
  project_type_name: Joi.string().trim().required().label("Project Type Name"),
});

const createProjectTypeSchema = projectTypeSchema;
const updateProjectTypeSchema = projectTypeSchema.min(1);

module.exports = { createProjectTypeSchema, updateProjectTypeSchema };
