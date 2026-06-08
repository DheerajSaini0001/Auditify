import mongoose from "mongoose";
import logger from "../utils/logger.js";

const dbConnect = async (options = {}) => {
  try {
    const defaultOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(process.env.MONGO_URI, { ...defaultOptions, ...options });
    logger.info("✅ MongoDB Connected");
  } catch (err) {
    logger.error("MongoDB Error", err);
  }
};

export default dbConnect;
