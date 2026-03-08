const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const createTransferSchema = Joi.object({
  project_id: objectId.required(),
  from_store_id: objectId.required(),
  to_store_id: objectId.required(),
  transfer_date: Joi.date().required(),
  transferred_by: objectId.allow(null),
  remark: Joi.string().trim().allow("", null),
  documents: Joi.string().allow("", null),
  items: Joi.array()
    .items(
      Joi.object({
        item_id: objectId.required(),
        quantity: Joi.number().min(0.0001).required(),
        remark: Joi.string().trim().allow("", null),
      }),
    )
    .min(1)
    .required(),
});

const receiveTransferSchema = Joi.object({
  received_by: objectId.allow(null),
  received_date: Joi.date().required(),
  remark: Joi.string().trim().allow("", null),
});

module.exports = { createTransferSchema, receiveTransferSchema };
