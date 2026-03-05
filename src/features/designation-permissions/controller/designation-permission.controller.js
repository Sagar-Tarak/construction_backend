const mongoose = require("mongoose");
const DesignationPermission = require("../model/designation-permission.model");
const AppModule = require("../../app-modules/model/app-module.model");

// Exported and reused by team member login
const resolvePermissions = async (user_id, designation_id) => {
  const perms = await DesignationPermission.find({
    user_id,
    designation_id,
  }).populate("module_id", "module_name");

  const permMap = {};

  perms.forEach((p) => {
    if (!p.module_id) return;
    const key = p.module_id.module_name.toLowerCase().replace(/ /g, "_");
    permMap[key] = {
      add: p.can_add,
      view: p.can_view,
      edit: p.can_edit,
      delete: p.can_delete,
      approve: p.can_approve,
      reject: p.can_reject,
      download: p.can_download,
      report: p.can_report,
      view_all: p.can_view_all,
      notification: p.can_notification,
      transfer: p.can_transfer,
    };
  });

  return permMap;
};

const getPermissionMatrix = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const designation_id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(designation_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid designation ID." });
    }

    const allModules = await AppModule.find({ active: true }).sort({
      sort_order: 1,
    });
    const saved = await DesignationPermission.find({ user_id, designation_id });

    const savedMap = saved.reduce((acc, p) => {
      acc[p.module_id.toString()] = p;
      return acc;
    }, {});

    const matrix = allModules.map((mod) => {
      const e = savedMap[mod._id.toString()]; // e = existing record or undefined
      return {
        module_id: mod._id,
        module_name: mod.module_name,
        module_group: mod.module_group,
        available_permissions: mod.available_permissions,
        can_add: e?.can_add ?? false,
        can_view: e?.can_view ?? false,
        can_edit: e?.can_edit ?? false,
        can_delete: e?.can_delete ?? false,
        can_approve: e?.can_approve ?? false,
        can_reject: e?.can_reject ?? false,
        can_download: e?.can_download ?? false,
        can_report: e?.can_report ?? false,
        can_view_all: e?.can_view_all ?? false,
        can_notification: e?.can_notification ?? false,
        can_transfer: e?.can_transfer ?? false,
      };
    });

    return res.status(200).json({ success: true, data: { matrix } });
  } catch (err) {
    next(err);
  }
};

const savePermissionMatrix = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const designation_id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(designation_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid designation ID." });
    }

    const { permissions } = req.body;

    const ops = permissions.map((m) => ({
      updateOne: {
        filter: {
          user_id,
          designation_id,
          module_id: new mongoose.Types.ObjectId(m.module_id),
        },
        update: {
          $set: {
            can_add: m.can_add ?? false,
            can_view: m.can_view ?? false,
            can_edit: m.can_edit ?? false,
            can_delete: m.can_delete ?? false,
            can_approve: m.can_approve ?? false,
            can_reject: m.can_reject ?? false,
            can_download: m.can_download ?? false,
            can_report: m.can_report ?? false,
            can_view_all: m.can_view_all ?? false,
            can_notification: m.can_notification ?? false,
            can_transfer: m.can_transfer ?? false,
            updated_at: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await DesignationPermission.bulkWrite(ops);

    return res.status(200).json({
      success: true,
      message: "Permissions saved successfully.",
      data: { upserted: result.upsertedCount, modified: result.modifiedCount },
    });
  } catch (err) {
    next(err);
  }
};

const getMyPermissions = async (req, res, next) => {
  try {
    const permMap = await resolvePermissions(
      req.user._id,
      req.member.designation_id,
    );
    return res
      .status(200)
      .json({ success: true, data: { permissions: permMap } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPermissionMatrix,
  savePermissionMatrix,
  getMyPermissions,
  resolvePermissions,
};
