require("dotenv").config();
const mongoose = require("mongoose");
const AppModule = require("./model/app-module.model");

const modules = [
  // Project Management
  {
    module_name: "Project",
    module_group: "Project Management",
    available_permissions: ["add", "view", "edit", "delete", "view_all"],
    sort_order: 1,
  },
  {
    module_name: "Daily Worksheet",
    module_group: "Project Management",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "download",
      "report",
      "notification",
    ],
    sort_order: 2,
  },
  {
    module_name: "Equipment Usage",
    module_group: "Project Management",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "download",
      "report",
      "notification",
    ],
    sort_order: 3,
  },
  {
    module_name: "Project Drawings",
    module_group: "Project Management",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "download",
      "notification",
    ],
    sort_order: 4,
  },
  {
    module_name: "Task",
    module_group: "Project Management",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "approve",
      "reject",
      "report",
      "notification",
      "view_all",
    ],
    sort_order: 5,
  },
  {
    module_name: "Issues and Snags",
    module_group: "Project Management",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "approve",
      "reject",
      "report",
      "notification",
    ],
    sort_order: 6,
  },
  {
    module_name: "Inspection Request",
    module_group: "Project Management",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "approve",
      "reject",
      "report",
      "notification",
    ],
    sort_order: 7,
  },

  // Procurement
  {
    module_name: "Purchase Request",
    module_group: "Procurement",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "approve",
      "reject",
      "download",
    ],
    sort_order: 8,
  },
  {
    module_name: "Purchase Order",
    module_group: "Procurement",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "approve",
      "download",
    ],
    sort_order: 9,
  },
  {
    module_name: "Materials Received",
    module_group: "Procurement",
    available_permissions: [
      "add",
      "view",
      "edit",
      "delete",
      "download",
      "report",
    ],
    sort_order: 10,
  },

  // Inventory
  {
    module_name: "Central Store Request",
    module_group: "Inventory",
    available_permissions: [
      "add",
      "view",
      "edit",
      "approve",
      "reject",
      "download",
    ],
    sort_order: 11,
  },
  {
    module_name: "Project Inventory",
    module_group: "Inventory",
    available_permissions: ["view", "report", "view_all"],
    sort_order: 12,
  },
  {
    module_name: "Material Transfer",
    module_group: "Inventory",
    available_permissions: [
      "add",
      "view",
      "edit",
      "approve",
      "reject",
      "transfer",
    ],
    sort_order: 13,
  },

  // Settings
  {
    module_name: "Team Member",
    module_group: "Settings",
    available_permissions: ["add", "view", "edit", "delete"],
    sort_order: 14,
  },
  {
    module_name: "Contractor",
    module_group: "Settings",
    available_permissions: ["add", "view", "edit", "delete"],
    sort_order: 15,
  },
  {
    module_name: "Supplier",
    module_group: "Settings",
    available_permissions: ["add", "view", "edit", "delete"],
    sort_order: 16,
  },
  {
    module_name: "Vendor",
    module_group: "Settings",
    available_permissions: ["add", "view", "edit", "delete"],
    sort_order: 17,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const ops = modules.map((m) => ({
      updateOne: {
        filter: { module_name: m.module_name },
        update: { $set: m },
        upsert: true,
      },
    }));

    const result = await AppModule.bulkWrite(ops);
    console.log(
      `Seed complete. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`,
    );
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seed();
