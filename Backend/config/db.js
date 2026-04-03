import mongoose from "mongoose";

const dbConnect = async (options = {}) => {
  try {
    const defaultOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(process.env.MONGO_URI, { ...defaultOptions, ...options });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Error:", err);
  }
};

export default dbConnect;
