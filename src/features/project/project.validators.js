const Joi = require("joi");

const createProjectSchema = Joi.object({
  project_name: Joi.string().trim().required().messages({
    "string.empty": "Project name is required.",
    "any.required": "Project name is required.",
  }),
  project_start_date: Joi.date().optional().allow(null),
  expected_completion_date: Joi.date().optional().allow(null),
  project_address: Joi.string().trim().optional().allow(null, ""),
  project_status_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid project status ID.",
    }),
  project_type_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid project type ID.",
    }),
});

const updateProjectSchema = Joi.object({
  project_name: Joi.string().trim().optional().messages({
    "string.empty": "Project name cannot be empty.",
  }),
  project_start_date: Joi.date().optional().allow(null),
  expected_completion_date: Joi.date().optional().allow(null),
  project_address: Joi.string().trim().optional().allow(null, ""),
  project_status_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid project status ID.",
    }),
  project_type_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid project type ID.",
    }),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createProjectSchema, updateProjectSchema };
