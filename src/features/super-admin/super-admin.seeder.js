// Run with: node src/features/super-admin/super-admin.seeder.js
// Reads SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD from .env
// Safe to re-run — uses upsert

require("dotenv").config();
const mongoose = require("mongoose");
const SuperAdmin = require("./super-admin.model");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env",
    );
    process.exit(1);
  }

  const existing = await SuperAdmin.findOne({ email });
  if (existing) {
    console.log("Super admin already exists");
    process.exit(0);
  }

  const superAdmin = new SuperAdmin({ name, email, password });
  await superAdmin.save();
  console.log(`Super admin created: ${email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
