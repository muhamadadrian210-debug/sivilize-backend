const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    // Check if MongoDB URI is configured
    if (!mongoURI || mongoURI.includes('mongodb://127.0.0.1') || mongoURI.includes('localhost')) {
      console.log('ℹ️  Using Local Storage Mode (JSON file)');
      console.log('⚠️  WARNING: This mode is not recommended for production!');
      console.log('📝 To enable MongoDB, update MONGODB_URI in .env file');
      return false;
    }

    // Attempt to connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for performance
    await createIndexes();
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Falling back to Local Storage Mode (JSON file)');
    console.log('📝 For production, configure a real MongoDB instance');
    return false;
  }
};

// Create database indexes for performance optimization
const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Project = require('../models/Project');
    
    // User indexes
    await User.collection.createIndex({ email: 1 });
    
    // Project indexes
    await Project.collection.createIndex({ user: 1, createdAt: -1 });
    await Project.collection.createIndex({ status: 1 });
    
    console.log('📊 Database indexes created successfully');
  } catch (err) {
    console.warn('⚠️  Warning: Could not create indexes:', err.message);
  }
};

module.exports = connectDB;
