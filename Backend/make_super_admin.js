import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const makeSuperAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    user.role = 'super_admin';
    await user.save();
    console.log(`User ${email} is now a super_admin`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Please provide an email: node make_super_admin.js user@example.com');
  process.exit(1);
}

makeSuperAdmin(email);
