const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { userId, email, role, department } = req.body;

    // Validation Regex
    const studentIdRegex = /^7376[A-Z]{2}[0-9]{3,}$/;
    const staffIdRegex = /^S[A-Z]{2}[0-9]{4,}$/;
    const hodIdRegex = /^H[A-Z]{2}[0-9]{4,}$/;

    const deptCode = department ? department.substring(0, 2).toUpperCase() : "";

    if (role === 'security') {
      const securityDefaults = {
        'Boys Hostel':  { name: 'Boys Hostel Security',  userId: 'bhsec' },
        'Girls Hostel': { name: 'Girls Hostel Security', userId: 'ghsec' },
        'Main Gate':    { name: 'Main Gate Security',    userId: 'mgsec' },
      };
      const defaults = securityDefaults[req.body.securityType];
      if (defaults) {
        req.body.name = defaults.name;
        req.body.userId = defaults.userId;
      }
    } else {
      if (role === 'student' && !studentIdRegex.test(userId)) {
        return res.status(400).json({ message: 'Student ID must be in format: 7376[DeptCode][RollNum] (e.g. 7376CS101)' });
      }
      if (role === 'staff' && !staffIdRegex.test(userId)) {
        return res.status(400).json({ message: 'Staff ID must be in format: S[DeptCode][RollNum] (e.g. SCS1230)' });
      }
      if (role === 'hod' && !hodIdRegex.test(userId)) {
        return res.status(400).json({ message: 'HOD ID must be in format: H[DeptCode][RollNum] (e.g. HCS2414)' });
      }
    }

    // Email validation
    const emailDomain = role === 'student' ? 'student.edu' : (role === 'hod' ? 'hod.edu' : 'staff.edu');
    const expectedEmailEnd = `@${emailDomain}`;
    if (role !== 'security' && !email.endsWith(expectedEmailEnd)) {
        return res.status(400).json({ message: `Email for ${role} must end with ${expectedEmailEnd}` });
    }

    const userExists = await User.findOne({ $or: [{ userId }, { email }] });

    if (userExists) {
      const field = userExists.userId === userId ? 'User ID' : 'Email';
      return res.status(400).json({ message: `${field} already exists` });
    }

    // Default password is 'pwd123' as per strict requirements
    const password = 'pwd123';
    
    const userData = { ...req.body, password };
    if (userData.hodId) userData.hodId = userData.hodId.toLowerCase();
    if (userData.mentorId) userData.mentorId = userData.mentorId.toLowerCase();
    if (userData.wardenId) userData.wardenId = userData.wardenId.toLowerCase();

    const user = await User.create(userData);

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role && role !== 'All') {
      query.role = role.toLowerCase();
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      const { userId, email, role, department } = req.body;
      const studentIdRegex = /^7376[A-Z]{2}[0-9]{3,}$/;
      const staffIdRegex = /^S[A-Z]{2}[0-9]{4,}$/;
      const hodIdRegex = /^H[A-Z]{2}[0-9]{4,}$/;

      if (role === 'security') {
        const securityDefaults = {
          'Boys Hostel':  { name: 'Boys Hostel Security',  userId: 'bhsec' },
          'Girls Hostel': { name: 'Girls Hostel Security', userId: 'ghsec' },
          'Main Gate':    { name: 'Main Gate Security',    userId: 'mgsec' },
        };
        const defaults = securityDefaults[req.body.securityType];
        if (defaults) {
          req.body.name = defaults.name;
          req.body.userId = defaults.userId;
        }
      } else if (userId && userId !== user.userId) {
          if (role === 'student' && !studentIdRegex.test(userId)) {
              return res.status(400).json({ message: 'Student ID must be in format: 7376[DeptCode][RollNum] (e.g. 7376CS101)' });
          }
          if (role === 'staff' && !staffIdRegex.test(userId)) {
              return res.status(400).json({ message: 'Staff ID must be in format: S[DeptCode][RollNum] (e.g. SCS1230)' });
          }
          if (role === 'hod' && !hodIdRegex.test(userId)) {
              return res.status(400).json({ message: 'HOD ID must be in format: H[DeptCode][RollNum] (e.g. HCS2414)' });
          }
      }

      if (email && email !== user.email && role !== 'security') {
          const emailDomain = role === 'student' ? 'student.edu' : (role === 'hod' ? 'hod.edu' : 'staff.edu');
          const expectedEmailEnd = `@${emailDomain}`;
          if (!email.endsWith(expectedEmailEnd)) {
              return res.status(400).json({ message: `Email for ${role} must end with ${expectedEmailEnd}` });
          }
      }

      // Unique check
      if (userId !== user.userId || email !== user.email) {
          const checkQuery = { _id: { $ne: user._id }, $or: [] };
          if (userId !== user.userId) checkQuery.$or.push({ userId });
          if (email !== user.email) checkQuery.$or.push({ email });

          if (checkQuery.$or.length > 0) {
              const userExists = await User.findOne(checkQuery);
              if (userExists) {
                  const field = userExists.userId === userId ? 'User ID' : 'Email';
                  return res.status(400).json({ message: `${field} already exists` });
              }
          }
      }

      const { password, ...updateData } = req.body;
      if (updateData.hodId) updateData.hodId = updateData.hodId.toLowerCase();
      if (updateData.mentorId) updateData.mentorId = updateData.mentorId.toLowerCase();
      if (updateData.wardenId) updateData.wardenId = updateData.wardenId.toLowerCase();
      
      Object.assign(user, updateData);
      if (password && password.trim() !== '') {
          user.password = password;
      }
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const toggleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.status = user.status === 'active' ? 'inactive' : 'active';
      await user.save();
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
const resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash('pwd123', salt);
      await user.save();
      res.json({ message: 'Password reset to default (pwd123)' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileData = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      gender: user.gender,
      department: user.department || 'N/A',
      phone: user.phone || 'N/A',
      parentPhone: user.parentPhone || 'N/A',
      residentialStatus: user.residentialStatus || 'N/A',
      roleType: user.staffType || (user.role === 'hod' ? 'HOD' : user.role === 'admin' ? 'Admin' : 'N/A'),
      status: user.status,
      securityType: user.securityType || null,
    };

    // Resolve HOD 
    if (user.hodId) {
      const hod = await User.findOne({ userId: { $regex: new RegExp(`^${user.hodId.trim()}$`, 'i') } });
      profileData.hod = hod ? { name: hod.name, userId: hod.userId.toUpperCase() } : { name: "N/A", userId: user.hodId.toUpperCase() };
    } else {
      profileData.hod = null;
    }

    // Resolve Mentor 
    if (user.mentorId) {
      const mentor = await User.findOne({ userId: { $regex: new RegExp(`^${user.mentorId.trim()}$`, 'i') } });
      profileData.mentor = mentor ? { name: mentor.name, userId: mentor.userId.toUpperCase() } : { name: "N/A", userId: user.mentorId.toUpperCase() };
    } else {
      profileData.mentor = null;
    }

    // Resolve Warden 
    if (user.wardenId) {
      const warden = await User.findOne({ userId: { $regex: new RegExp(`^${user.wardenId.trim()}$`, 'i') } });
      profileData.warden = warden ? { name: warden.name, userId: warden.userId.toUpperCase() } : { name: "N/A", userId: user.wardenId.toUpperCase() };
    } else {
      profileData.warden = null;
    }

    res.json(profileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unique departments
// @route   GET /api/users/departments
// @access  Private/Admin
const getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct('department', { department: { $ne: null, $exists: true } });
    const filteredDepartments = departments.filter(d => d && d !== 'N/A' && d.trim() !== '');
    res.json(filteredDepartments.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  toggleStatus,
  resetPassword,
  getProfile,
  getDepartments,
};
