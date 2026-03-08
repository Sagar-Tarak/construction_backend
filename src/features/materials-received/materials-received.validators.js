const Joi = require("joi");

const receivedItemSchema = Joi.object({
  purchase_order_item_id: Joi.string()
    .hex()
    .length(24)
    .optional()
    .allow(null, "")
    .messages({
      "string.length": "Invalid purchase order item ID.",
    }),
  item_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid item ID.",
    "any.required": "Item is required.",
  }),
  store_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid store ID.",
    "any.required": "Store ID is required for each item.",
  }),
  quantity_received: Joi.number().min(0.01).required().messages({
    "number.min": "Quantity must be greater than 0.",
    "any.required": "Quantity received is required.",
  }),
  unit_rate: Joi.number().min(0).optional().allow(null),
  gst_rate_value: Joi.number().min(0).optional().allow(null),
  remark: Joi.string().trim().optional().allow(null, ""),
});

const createMaterialsReceivedSchema = Joi.object({
  received_date: Joi.date().required().messages({
    "any.required": "Received date is required.",
  }),
  received_by: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid team member ID.",
    "any.required": "Received by is required.",
  }),
  supplier_id: Joi.string().hex().length(24).optional().allow(null, ""),
  purchase_order_no: Joi.string().trim().optional().allow(null, ""),
  status: Joi.string()
    .valid("partial", "completed")
    .optional()
    .default("partial"),
  invoice_number: Joi.string().trim().optional().allow(null, ""),
  invoice_date: Joi.date().optional().allow(null),
  total_invoice_amount: Joi.number().min(0).optional().allow(null),
  location_type: Joi.string().trim().optional().allow(null, ""),
  unloading_location: Joi.string().trim().optional().allow(null, ""),
  vehicle_no: Joi.string().trim().optional().allow(null, ""),
  delivery_challan_number: Joi.string().trim().optional().allow(null, ""),
  payment_term: Joi.string().trim().optional().allow(null, ""),
  remark: Joi.string().trim().optional().allow(null, ""),
  documents: Joi.string().trim().optional().allow(null, ""),
  items: Joi.array().items(receivedItemSchema).min(1).required().messages({
    "array.min": "At least one item is required.",
    "any.required": "Items are required.",
  }),

  // project_id required to know where to add inventory
  project_id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid project ID.",
    "any.required": "Project ID is required to update inventory.",
  }),
});

const updateMaterialsReceivedSchema = Joi.object({
  received_date: Joi.date().optional(),
  received_by: Joi.string().hex().length(24).optional(),
  supplier_id: Joi.string().hex().length(24).optional().allow(null, ""),
  invoice_number: Joi.string().trim().optional().allow(null, ""),
  invoice_date: Joi.date().optional().allow(null),
  total_invoice_amount: Joi.number().min(0).optional().allow(null),
  location_type: Joi.string().trim().optional().allow(null, ""),
  unloading_location: Joi.string().trim().optional().allow(null, ""),
  vehicle_no: Joi.string().trim().optional().allow(null, ""),
  delivery_challan_number: Joi.string().trim().optional().allow(null, ""),
  payment_term: Joi.string().trim().optional().allow(null, ""),
  remark: Joi.string().trim().optional().allow(null, ""),
  documents: Joi.string().trim().optional().allow(null, ""),
})
  .min(1)
  .messages({
    "object.min": "Provide at least one field to update.",
  });

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("completed").required().messages({
    "any.only": "Status can only be set to 'completed'.",
    "any.required": "Status is required.",
  }),
});

module.exports = {
  createMaterialsReceivedSchema,
  updateMaterialsReceivedSchema,
  updateStatusSchema,
};
