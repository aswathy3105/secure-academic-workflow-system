const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const resetAllPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academic_workflow');
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Resetting passwords to pwd123...`);

    for (const user of users) {
      user.password = 'pwd123';
      user.isFirstLogin = true;
      await user.save();
      console.log(`Reset: ${user.email}`);
    }

    console.log('All passwords reset successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetAllPasswords();
