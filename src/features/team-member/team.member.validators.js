const Joi = require("joi");

const createTeamMemberSchema = Joi.object({
  user_name: Joi.string().trim().required().messages({
    "string.empty": "Name is required.",
    "any.required": "Name is required.",
  }),
  designation_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid designation ID.",
    }),
  user_email: Joi.string().trim().email().optional().allow(null, "").messages({
    "string.email": "Enter a valid email address.",
  }),
  mobile_number: Joi.string().trim().required().messages({
    "string.empty": "Mobile number is required.",
    "any.required": "Mobile number is required.",
  }),
  user_pan: Joi.string().trim().uppercase().optional().allow(null, ""),
  user_emergency_number: Joi.string().trim().optional().allow(null, ""),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters.",
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
  user_address: Joi.string().trim().optional().allow(null, ""),

  // Optional project assignments on create (spec §5)
  project_ids: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional()
    .default([]),
});

const updateTeamMemberSchema = Joi.object({
  user_name: Joi.string().trim().optional().messages({
    "string.empty": "Name cannot be empty.",
  }),
  designation_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid designation ID.",
    }),
  user_email: Joi.string().trim().email().optional().allow(null, "").messages({
    "string.email": "Enter a valid email address.",
  }),
  mobile_number: Joi.string().trim().optional().allow(null, ""),
  user_pan: Joi.string().trim().uppercase().optional().allow(null, ""),
  user_emergency_number: Joi.string().trim().optional().allow(null, ""),
  password: Joi.string().min(6).optional().messages({
    "string.min": "Password must be at least 6 characters.",
  }),
  user_address: Joi.string().trim().optional().allow(null, ""),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createTeamMemberSchema, updateTeamMemberSchema };
