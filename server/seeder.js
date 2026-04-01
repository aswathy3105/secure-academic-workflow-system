const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Request = require('./models/Request');
const connectDB = require('./config/db');

dotenv.config();

const users = [
  {
    userId: 'admin01',
    name: 'System Administrator',
    email: 'admin@awas.edu',
    password: 'password123',
    role: 'admin',
    status: 'active',
  },
  {
    userId: 'st101',
    name: 'John Student',
    email: 'john@student.edu',
    password: 'password123',
    role: 'student',
    status: 'active',
    mentorId: 'staff_m',
    hodId: 'hod_cs',
  },
  {
    userId: 'hod_cs',
    name: 'Dr. Sarah Wilson',
    email: 'sarah@hod.edu',
    password: 'password123',
    role: 'hod',
    status: 'active',
  },
  {
    userId: 'staff_m',
    name: 'Mentor Mike',
    email: 'mike@awas.edu',
    password: 'password123',
    role: 'staff',
    status: 'active',
    staffType: 'Mentor',
    hodId: 'hod_cs',
  },
  {
    userId: 'warden01',
    name: 'Hostel Warden',
    email: 'warden@awas.edu',
    password: 'password123',
    role: 'staff',
    status: 'active',
    staffType: 'Warden',
  },
  {
    userId: 'sec_01',
    name: 'Security Ops',
    email: 'security@awas.edu',
    password: 'password123',
    role: 'security',
    status: 'active',
  },
];

const requests = [
  {
    userId: 'st101',
    name: 'John Student',
    role: 'student',
    title: 'Leave Request for 2 days',
    description: 'I need to go home for a family function.',
    status: 'Pending',
  },
  {
    userId: 'st101',
    name: 'John Student',
    role: 'student',
    title: 'Exam Permission',
    description: 'Permission for re-exam due to health issues.',
    status: 'Approved',
  },
  {
    userId: 'hod_cs',
    name: 'Dr. Sarah Wilson',
    role: 'hod',
    title: 'New Recruitment Request',
    description: 'Requesting permission to hire 2 new faculty members.',
    status: 'Pending',
  },
];

const seedDB = async () => {
  try {
    await connectDB();
    
    // Drop collections to clear old indexes that might cause conflicts
    try {
      await mongoose.connection.db.dropCollection('users');
      console.log('Users collection dropped');
    } catch (e) {
      console.log('Users collection not found, skipping drop');
    }

    try {
      await mongoose.connection.db.dropCollection('requests');
      console.log('Requests collection dropped');
    } catch (e) {
      console.log('Requests collection not found, skipping drop');
    }
    
    await User.create(users);
    console.log('Default users created');

    await Request.create(requests);
    console.log('Default requests created');
    
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB().catch(err => {
  console.error('CRITICAL SEEDING ERROR:', err);
  process.exit(1);
});
