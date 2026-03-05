const Joi = require("joi");

const orderItemSchema = Joi.object({
  item_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid item ID.",
    "any.required": "Item is required.",
  }),
  quantity: Joi.number().min(0.01).required().messages({
    "number.min": "Quantity must be greater than 0.",
    "any.required": "Quantity is required.",
  }),
  unit_rate: Joi.number().min(0).required().messages({
    "number.min": "Unit rate cannot be negative.",
    "any.required": "Unit rate is required.",
  }),
  discount: Joi.number().min(0).max(100).optional().default(0).messages({
    "number.min": "Discount cannot be negative.",
    "number.max": "Discount cannot exceed 100%.",
  }),
  gst_rate_id: Joi.string().hex().length(24).optional().allow(null, ""),
  remark: Joi.string().trim().optional().allow(null, ""),
});

const createPurchaseOrderSchema = Joi.object({
  purchase_order_date: Joi.date().required().messages({
    "any.required": "Purchase order date is required.",
  }),
  purchase_request_no: Joi.string().trim().required().messages({
    "string.empty": "Purchase request number is required.",
    "any.required": "Purchase request number is required.",
  }),
  location_type: Joi.string().trim().optional().allow(null, ""),
  supplier_id: Joi.string().hex().length(24).optional().allow(null, ""),
  expected_delivery_date: Joi.date().required().messages({
    "any.required": "Expected delivery date is required.",
  }),
  delivery_address: Joi.string().trim().optional().allow(null, ""),
  contact_person_name: Joi.string().trim().optional().allow(null, ""),
  additional_charges: Joi.number().min(0).optional().default(0),
  deduction_amount: Joi.number().min(0).optional().default(0),
  payment_term: Joi.string().trim().optional().allow(null, ""),
  terms_condition_id: Joi.string().hex().length(24).optional().allow(null, ""),
  remark: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    "array.min": "At least one item is required.",
    "any.required": "Items are required.",
  }),
});

const updatePurchaseOrderSchema = Joi.object({
  purchase_order_date: Joi.date().optional(),
  location_type: Joi.string().trim().optional().allow(null, ""),
  supplier_id: Joi.string().hex().length(24).optional().allow(null, ""),
  expected_delivery_date: Joi.date().optional(),
  delivery_address: Joi.string().trim().optional().allow(null, ""),
  contact_person_name: Joi.string().trim().optional().allow(null, ""),
  additional_charges: Joi.number().min(0).optional(),
  deduction_amount: Joi.number().min(0).optional(),
  payment_term: Joi.string().trim().optional().allow(null, ""),
  terms_condition_id: Joi.string().hex().length(24).optional().allow(null, ""),
  remark: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(orderItemSchema).min(1).optional().messages({
    "array.min": "At least one item is required.",
  }),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("sent", "acknowledged", "completed", "cancelled")
    .required()
    .messages({
      "any.only":
        "Status must be one of: sent, acknowledged, completed, cancelled.",
      "any.required": "Status is required.",
    }),
});

module.exports = {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updateStatusSchema,
};
