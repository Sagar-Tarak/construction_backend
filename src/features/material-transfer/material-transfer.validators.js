const Joi = require("joi");

const transferItemSchema = Joi.object({
  item_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid item ID.",
    "any.required": "Item is required.",
  }),
  quantity: Joi.number().min(0.01).required().messages({
    "number.min": "Quantity must be greater than 0.",
    "any.required": "Quantity is required.",
  }),
  remark: Joi.string().trim().optional().allow(null, ""),
});

const createTransferSchema = Joi.object({
  transfer_date: Joi.date().required().messages({
    "any.required": "Transfer date is required.",
  }),
  from_project_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid source project ID.",
    "any.required": "Source project is required.",
  }),
  to_project_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid destination project ID.",
    "any.required": "Destination project is required.",
  }),
  transferred_by: Joi.string().hex().length(24).optional().allow(null, ""),
  remark: Joi.string().trim().optional().allow(null, ""),
  documents: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(transferItemSchema).min(1).required().messages({
    "array.min": "At least one item is required.",
    "any.required": "Items are required.",
  }),
});

const receiveTransferSchema = Joi.object({
  received_by: Joi.string().hex().length(24).optional().allow(null, ""),
  received_date: Joi.date().required().messages({
    "any.required": "Received date is required.",
  }),
});

module.exports = { createTransferSchema, receiveTransferSchema };
