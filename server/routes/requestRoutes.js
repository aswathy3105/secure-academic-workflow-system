const express = require('express');
const router = express.Router();
const { 
  getStudentStats, 
  getStaffStats,
  getAssignedStats,
  getHODStats,
  getHODRequests,
  createRequest, 
  getMyRequests,
  getAssignedRequests,
  approveRequest,
  rejectRequest,
  getAdminStats,
  getAdminRequests,
  forwardToGate,
  generateOTP,
  verifyOTP,
  deleteRequest,
  getRequestById,
  getRequestAnalytics,
  getSecureProof
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');

router.get('/admin/analytics', protect, authorize('admin'), getRequestAnalytics);
router.get('/stats', protect, authorize('admin'), getAdminStats);
router.get('/', protect, authorize('admin'), getAdminRequests);
router.get('/student/stats', protect, getStudentStats);
router.get('/staff/stats', protect, getStaffStats);
router.get('/assigned/stats', protect, getAssignedStats);
router.get('/hod/stats', protect, getHODStats);
router.get('/hod', protect, getHODRequests);
router.get('/assigned', protect, getAssignedRequests);
router.post('/', protect, upload.single('proofFile'), createRequest);
router.get('/my', protect, getMyRequests);
router.get('/:id', protect, getRequestById);
router.get('/proof/:filename', protect, getSecureProof);
router.put('/:id/approve', protect, approveRequest);
router.put('/:id/reject', protect, rejectRequest);
router.delete('/:id', protect, authorize('admin'), deleteRequest);

// Security routes
router.post('/:id/forward-to-gate', protect, forwardToGate);
router.post('/:id/otp/generate', protect, generateOTP);
router.post('/:id/otp/verify', protect, verifyOTP);

module.exports = router;
