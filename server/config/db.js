const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.includes('<username>')) {
      console.error('❌ MONGODB_URI is undefined or contains placeholders (<username>, <password>, etc.) in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      dbName: 'secureAcademicDB'
    });
    console.log(`MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
