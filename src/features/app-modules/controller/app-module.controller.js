const AppModule = require("../model/app-module.model");

const getAppModules = async (req, res, next) => {
  try {
    const modules = await AppModule.find({ active: true }).sort({
      sort_order: 1,
    });

    const grouped = modules.reduce((acc, mod) => {
      const group = mod.module_group || "General";
      if (!acc[group]) acc[group] = [];
      acc[group].push(mod);
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: { grouped, flat: modules },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAppModules };
