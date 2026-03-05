const Joi = require("joi");

const labourCategorySchema = Joi.object({
  category_name: Joi.string().trim().required().label("Category Name"),
});

const createLabourCategorySchema = labourCategorySchema;
const updateLabourCategorySchema = labourCategorySchema.min(1);

module.exports = { createLabourCategorySchema, updateLabourCategorySchema };
