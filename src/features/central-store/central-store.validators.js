const Joi = require("joi");

const createCentralStoreSchema = Joi.object({
  store_name: Joi.string().trim().required().messages({
    "string.empty": "Store name is required.",
    "any.required": "Store name is required.",
  }),
  store_address: Joi.string().trim().required().messages({
    "string.empty": "Store address is required.",
    "any.required": "Store address is required.",
  }),
});

const updateCentralStoreSchema = Joi.object({
  store_name: Joi.string().trim().optional().messages({
    "string.empty": "Store name cannot be empty.",
  }),
  store_address: Joi.string().trim().optional().messages({
    "string.empty": "Store address cannot be empty.",
  }),
  active: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

module.exports = { createCentralStoreSchema, updateCentralStoreSchema };
