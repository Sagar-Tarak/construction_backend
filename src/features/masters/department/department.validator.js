const Joi = require("joi");

const departmentSchema = Joi.object({
  department_name: Joi.string().trim().required().label("Department Name"),
});

const createDepartmentSchema = departmentSchema;
const updateDepartmentSchema = departmentSchema.min(1);

module.exports = { createDepartmentSchema, updateDepartmentSchema };
