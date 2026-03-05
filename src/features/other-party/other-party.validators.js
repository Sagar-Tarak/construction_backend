const Joi = require("joi");

const createOtherPartySchema = Joi.object({
  party_name: Joi.string().trim().required().messages({
    "string.empty": "Party name is required.",
    "any.required": "Party name is required.",
  }),
});

const updateOtherPartySchema = Joi.object({
  party_name: Joi.string().trim().optional().messages({
    "string.empty": "Party name cannot be empty.",
  }),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createOtherPartySchema, updateOtherPartySchema };
