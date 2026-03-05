require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./features/auth/models/user.model");

const adminData = {
  company_name: "Admin Company",
  user_email: "admin@example.com",
  password: "admin123", // will be hashed by pre-save hook
  phone: "",
  business_address: "",
  state: "",
  gst_no: "",
  pan_no: "",
  active: true,
};

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    // Check if admin already exists
    const exists = await User.findOne({ user_email: adminData.user_email });
    if (exists) {
      console.log("Admin user already exists.");
      return;
    }

    const admin = await User.create(adminData);
    console.log("Admin user created:", admin.user_email);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedAdmin();
