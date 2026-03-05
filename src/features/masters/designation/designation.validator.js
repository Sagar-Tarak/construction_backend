const Joi = require("joi");

const designationSchema = Joi.object({
  designation_name: Joi.string().trim().required().label("Designation Name"),
});

const createDesignationSchema = designationSchema;
const updateDesignationSchema = designationSchema.min(1);

module.exports = { createDesignationSchema, updateDesignationSchema };
