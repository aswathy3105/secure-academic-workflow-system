const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.includes('<username>')) {
      console.error('❌ MONGODB_URI is undefined or contains placeholders (<username>, <password>, etc.) in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    
    // Log URI (masked) for debugging
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`URI: ${maskedUri}`);

    await mongoose.connect(uri, {
      dbName: 'secureAcademicDB'
    });

    // Mongoose 6+ properties
    const host = mongoose.connection.host || 'Cluster0';
    const dbName = mongoose.connection.name || 'secureAcademicDB';

    console.log(`✅ MongoDB Atlas Connected Successfully: ${host}`);
    console.log(`✅ Database Name: ${dbName}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
