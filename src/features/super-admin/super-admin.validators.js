const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.email": "Valid email required.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
});

const rejectSchema = Joi.object({
  rejection_reason: Joi.string().trim().required().messages({
    "string.empty": "Rejection reason is required.",
    "any.required": "Rejection reason is required.",
  }),
});

module.exports = { loginSchema, rejectSchema };
