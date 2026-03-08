const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createStoreSchema = Joi.object({
  project_id: objectId.required(),
  store_name: Joi.string().trim().required(),
  location: Joi.string().trim().allow("", null),
  store_manager_id: objectId.allow(null),
});

const updateStoreSchema = Joi.object({
  store_name: Joi.string().trim(),
  location: Joi.string().trim().allow("", null),
  store_manager_id: objectId.allow(null),
});

module.exports = { createStoreSchema, updateStoreSchema };
