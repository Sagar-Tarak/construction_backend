const Joi = require("joi");

const memberLoginSchema = Joi.object({
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

module.exports = { memberLoginSchema };
