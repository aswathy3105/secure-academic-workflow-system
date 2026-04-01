const express = require('express');
const router = express.Router();
const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  toggleStatus,
  resetPassword,
  getProfile,
  getDepartments,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here protected
router.use(protect);

router.get('/profile', getProfile);

// Admin only routes
router.use(authorize('admin'));

router.route('/')
  .post(createUser)
  .get(getUsers);

router.get('/departments', getDepartments);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

router.patch('/:id/status', toggleStatus);
router.post('/:id/reset-password', resetPassword);

module.exports = router;
