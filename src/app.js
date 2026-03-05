const express = require("express");
const connectDB = require("./config/db");

const errorMiddleware = require("./features/auth/middleware/Error.middleware");
const { appModuleRoutes } = require("./features/app-modules");
const {
  designationPermissionRoutes,
} = require("./features/designation-permissions");
const { teamMemberRoutes } = require("./features/team-member");
const { authRoutes, memberAuthRoutes } = require("./features/auth");
const { contractorRoutes } = require("./features/contractor");
const { supplierRoutes } = require("./features/supplier");
const { vendorRoutes } = require("./features/vendor");
const { otherPartyRoutes } = require("./features/other-party");
const { projectRoutes } = require("./features/project");
const { centralStoreRoutes } = require("./features/central-store");
const { purchaseRequestRoutes } = require("./features/purchase-request");
const { purchaseOrderRoutes } = require("./features/purchase-order");
const { materialsReceivedRoutes } = require("./features/materials-received");
const { projectInventoryRoutes } = require("./features/project-inventory");
const { materialTransferRoutes } = require("./features/material-transfer");
// Masters
const {
  Designation,
  getRouter: getDesignationRouter,
} = require("./features/masters/designation");
const {
  Department,
  router: departmentRouter,
} = require("./features/masters/department");
const {
  GstRate,
  router: gstRateRouter,
} = require("./features/masters/gst-rate");
const {
  LabourCategory,
  router: labourCategoryRouter,
} = require("./features/masters/labour-category");
const {
  MeasurementUnit,
  router: measurementUnitRouter,
} = require("./features/masters/measurement-unit");
const {
  ProjectStatus,
  router: projectStatusRouter,
} = require("./features/masters/project-status");
const {
  ProjectType,
  router: projectTypeRouter,
} = require("./features/masters/project-type");
const {
  WorkType,
  router: workTypeRouter,
} = require("./features/masters/work-type");
const {
  TermsCondition,
  router: termsConditionRouter,
} = require("./features/masters/terms-condition");

// Materials
const {
  materialRoutes,
  materialCategoryRoutes,
} = require("./features/materials");

const app = express();

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Construction Backend API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/member", memberAuthRoutes);

app.use("/api/app-modules", appModuleRoutes);

// Designation: permission routes + CRUD routes both at /api/designations
app.use("/api/designations", designationPermissionRoutes);
app.use("/api/designations", getDesignationRouter());

app.use("/api/team-members", designationPermissionRoutes); // covers /me/permissions
app.use("/api/team-members", teamMemberRoutes);

// Masters CRUD
app.use("/api/departments", departmentRouter);
app.use("/api/gst-rates", gstRateRouter);
app.use("/api/labour-categories", labourCategoryRouter);
app.use("/api/measurement-units", measurementUnitRouter);
app.use("/api/project-statuses", projectStatusRouter);
app.use("/api/project-types", projectTypeRouter);
app.use("/api/work-types", workTypeRouter);
app.use("/api/terms-conditions", termsConditionRouter);

// Materials
app.use("/api/material-categories", materialCategoryRoutes);
app.use("/api/materials", materialRoutes);

app.use("/api/contractors", contractorRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/other-parties", otherPartyRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/central-stores", centralStoreRoutes);

app.use("/api/purchase-requests", purchaseRequestRoutes);

app.use("/api/purchase-orders", purchaseOrderRoutes);

app.use("/api/materials-received", materialsReceivedRoutes);

app.use("/api/project-inventory", projectInventoryRoutes);

app.use("/api/material-transfers", materialTransferRoutes);
// Error middleware must be LAST — catches next(err) from all routes above
app.use(errorMiddleware);

module.exports = app;
