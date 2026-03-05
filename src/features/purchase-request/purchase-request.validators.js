const Joi = require("joi");

const requestItemSchema = Joi.object({
  material_category_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid material category ID.",
    }),
  item_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid item ID.",
    "any.required": "Item is required.",
  }),
  quantity: Joi.number().min(0.01).required().messages({
    "number.min": "Quantity must be greater than 0.",
    "any.required": "Quantity is required.",
  }),
  measurement_unit_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid measurement unit ID.",
    }),
  remark: Joi.string().trim().optional().allow(null, ""),
});

const createPurchaseRequestSchema = Joi.object({
  purchase_request_date: Joi.date().required().messages({
    "any.required": "Purchase request date is required.",
  }),
  location_type: Joi.string().trim().optional().allow(null, ""),
  required_date: Joi.date().optional().allow(null),
  remark: Joi.string().trim().optional().allow(null, ""),
  document: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(requestItemSchema).min(1).required().messages({
    "array.min": "At least one item is required.",
    "any.required": "Items are required.",
  }),
});

const updatePurchaseRequestSchema = Joi.object({
  purchase_request_date: Joi.date().optional(),
  location_type: Joi.string().trim().optional().allow(null, ""),
  required_date: Joi.date().optional().allow(null),
  remark: Joi.string().trim().optional().allow(null, ""),
  document: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(requestItemSchema).min(1).optional().messages({
    "array.min": "At least one item is required.",
  }),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

const approveRejectSchema = Joi.object({
  action: Joi.string().valid("approved", "rejected").required().messages({
    "any.only": "Action must be either 'approved' or 'rejected'.",
    "any.required": "Action is required.",
  }),
  rejection_reason: Joi.when("action", {
    is: "rejected",
    then: Joi.string().trim().required().messages({
      "string.empty": "Rejection reason is required when rejecting.",
      "any.required": "Rejection reason is required when rejecting.",
    }),
    otherwise: Joi.string().trim().optional().allow(null, ""),
  }),
});

module.exports = {
  createPurchaseRequestSchema,
  updatePurchaseRequestSchema,
  approveRejectSchema,
};
