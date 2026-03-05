const Joi = require("joi");

const createContractorSchema = Joi.object({
  contractor_name: Joi.string().trim().required().messages({
    "string.empty": "Contractor name is required.",
    "any.required": "Contractor name is required.",
  }),
  department_id: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.length": "Invalid department ID.",
  }),
  contact_person: Joi.string().trim().optional().allow(null, ""),
  contact_number: Joi.string().trim().optional().allow(null, ""),
  address: Joi.string().trim().optional().allow(null, ""),
  gst_number: Joi.string().trim().optional().allow(null, ""),
  pan_number: Joi.string().trim().optional().allow(null, ""),
});

const updateContractorSchema = Joi.object({
  contractor_name: Joi.string().trim().optional().messages({
    "string.empty": "Contractor name cannot be empty.",
  }),
  department_id: Joi.string().hex().length(24).optional().allow(null, "").messages({
    "string.length": "Invalid department ID.",
  }),
  contact_person: Joi.string().trim().optional().allow(null, ""),
  contact_number: Joi.string().trim().optional().allow(null, ""),
  address: Joi.string().trim().optional().allow(null, ""),
  gst_number: Joi.string().trim().optional().allow(null, ""),
  pan_number: Joi.string().trim().optional().allow(null, ""),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createContractorSchema, updateContractorSchema };
