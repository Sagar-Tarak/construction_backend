const Joi = require("joi");

const termsConditionSchema = Joi.object({
  term_condition_name: Joi.string().trim().required().label("Term/Condition Name"),
  description: Joi.string().trim().optional().allow(""),
});

const createTermsConditionSchema = termsConditionSchema;
const updateTermsConditionSchema = Joi.object({
  term_condition_name: Joi.string().trim().optional().label("Term/Condition Name"),
  description: Joi.string().trim().optional().allow(""),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update." });

module.exports = { createTermsConditionSchema, updateTermsConditionSchema };
