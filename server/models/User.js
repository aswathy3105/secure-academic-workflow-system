const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'Please provide a unique user ID'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'Male', 'Female'],
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'student', 'staff', 'hod', 'security'],
      default: 'student',
    },
    securityType: {
      type: String,
      enum: ['Boys Hostel', 'Girls Hostel', 'Main Gate'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    department: String,
    phone: String,
    parentPhone: String,
    mentorId: String,
    hodId: String,
    residentialStatus: {
      type: String,
      enum: ['Dayscholar', 'Hosteller'],
    },
    wardenId: String,
    staffType: {
      type: String,
      enum: ['Mentor', 'Warden', 'Staff'],
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
