const Joi = require("joi");

const registerSchema = Joi.object({
  company_name: Joi.string().trim().required().messages({
    "string.empty": "Company name is required.",
    "any.required": "Company name is required.",
  }),
  user_email: Joi.string().trim().email().required().messages({
    "string.email": "Enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters.",
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
  phone: Joi.string().trim().optional().allow(""),
  business_address: Joi.string().trim().optional().allow(""),
  state: Joi.string().trim().optional().allow(""),
  gst_no: Joi.string().trim().optional().allow(""),
  pan_no: Joi.string().trim().optional().allow(""),
});

const loginSchema = Joi.object({
  user_email: Joi.string().trim().email().required().messages({
    "string.email": "Enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
});

const updateProfileSchema = Joi.object({
  company_name: Joi.string().trim().optional().messages({
    "string.empty": "Company name cannot be empty.",
  }),
  user_email: Joi.string().trim().email().optional().messages({
    "string.email": "Enter a valid email address.",
  }),
  password: Joi.string().min(6).optional().messages({
    "string.min": "Password must be at least 6 characters.",
  }),
  phone: Joi.string().trim().optional().allow(""),
  business_address: Joi.string().trim().optional().allow(""),
  state: Joi.string().trim().optional().allow(""),
  gst_no: Joi.string().trim().optional().allow(""),
  pan_no: Joi.string().trim().optional().allow(""),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { registerSchema, loginSchema, updateProfileSchema };
