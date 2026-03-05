const materialRoutes = require("./material.routes");
const Material = require("./material.model");
const { materialCategoryRoutes, MaterialCategory } = require("./category");

module.exports = {
  materialRoutes,
  Material,
  materialCategoryRoutes,
  MaterialCategory,
};
