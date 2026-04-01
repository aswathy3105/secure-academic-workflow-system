const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (Will be protected later for Admin)
const registerUser = async (req, res) => {
  const { userId, name, email, password, role, gender } = req.body;

  try {
    const userExists = await User.findOne({ 
      $or: [{ email }, { userId }]
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email or userId' });
    }

    const user = await User.create({
      userId,
      name,
      email,
      password,
      role,
      gender,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        gender: user.gender,
        staffType: user.staffType,
        securityType: user.securityType,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or userId

  try {
    const cleanIdentifier = identifier.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { userId: cleanIdentifier }]
    }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        gender: user.gender,
        staffType: user.staffType,
        securityType: user.securityType,
        isFirstLogin: user.isFirstLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
