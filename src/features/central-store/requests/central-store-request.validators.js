const Joi = require("joi");

const requestItemSchema = Joi.object({
  item_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid item ID.",
    "any.required": "Item is required.",
  }),
  quantity: Joi.number().min(0.01).required().messages({
    "number.min": "Quantity must be greater than 0.",
    "any.required": "Quantity is required.",
  }),
  unit_rate: Joi.number().min(0).optional().allow(null),
  notes: Joi.string().trim().optional().allow(null, ""),
});

const createRequestSchema = Joi.object({
  store_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid store ID.",
    "any.required": "Store is required.",
  }),
  requested_by: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid team member ID.",
    "any.required": "Requested by is required.",
  }),
  request_date: Joi.date().required().messages({
    "any.required": "Request date is required.",
  }),
  location_type: Joi.string().trim().optional().allow(null, ""),
  contractor_id: Joi.string().hex().length(24).optional().allow(null, ""),
  department_id: Joi.string().hex().length(24).optional().allow(null, ""),
  notes: Joi.string().trim().optional().allow(null, ""),
  file: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(requestItemSchema).min(1).required().messages({
    "array.min": "At least one item is required.",
    "any.required": "Items are required.",
  }),
});

const updateRequestSchema = Joi.object({
  location_type: Joi.string().trim().optional().allow(null, ""),
  contractor_id: Joi.string().hex().length(24).optional().allow(null, ""),
  department_id: Joi.string().hex().length(24).optional().allow(null, ""),
  notes: Joi.string().trim().optional().allow(null, ""),
  file: Joi.string().trim().optional().allow(null, ""),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

// Used when marking a request as received
const receiveRequestSchema = Joi.object({
  received_by: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid team member ID.",
    "any.required": "Received by is required.",
  }),
  received_date: Joi.date().required().messages({
    "any.required": "Received date is required.",
  }),
});

module.exports = {
  createRequestSchema,
  updateRequestSchema,
  receiveRequestSchema,
};
