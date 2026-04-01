const Request = require('../models/Request');
const User = require('../models/User');
const path = require('path');

// @desc    Get student request stats
// @route   GET /api/requests/student/stats
// @access  Private (Student)
const getStudentStats = async (req, res) => {
  try {
    const stats = await Request.aggregate([
      { $match: { requesterId: req.user.userId, requesterRole: 'student' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$finalStatus', 'Pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$finalStatus', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$finalStatus', 'Rejected'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, pending: 0, approved: 0, rejected: 0 };
    delete result._id;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get staff request stats (for requests they submitted)
// @route   GET /api/requests/staff/stats
// @access  Private (Staff/HOD)
const getStaffStats = async (req, res) => {
  try {
    const stats = await Request.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $in: ['$status', ['Approved', 'Forwarded to Gate', 'Out', 'Inside', 'Completed']] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, pending: 0, approved: 0, rejected: 0 };
    if (result._id) delete result._id;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stats for assigned requests (for Mentors/Wardens/HODs)
// @route   GET /api/requests/assigned/stats
// @access  Private (Staff/HOD)
const getAssignedStats = async (req, res) => {
  try {
    const userIdStr = req.user.userId;
    
    // Total assigned to them
    const totalAssigned = await Request.countDocuments({
      $or: [
        { mentorId: userIdStr, 'assignedTo.mentor': true },
        { wardenId: userIdStr, 'assignedTo.warden': true },
        { hodId: userIdStr, 'assignedTo.hod': true }
      ]
    });

    // Pending: where their specific status is 'Pending'
    const pendingApproval = await Request.countDocuments({
      $or: [
        { mentorId: userIdStr, 'assignedTo.mentor': true, mentorStatus: 'Pending' },
        { wardenId: userIdStr, 'assignedTo.warden': true, wardenStatus: 'Pending' },
        { hodId: userIdStr, 'assignedTo.hod': true, hodStatus: 'Pending' }
      ]
    });

    // Approved: where their specific status is 'Approved'
    const approvedByMe = await Request.countDocuments({
      $or: [
        { mentorId: userIdStr, 'assignedTo.mentor': true, mentorStatus: 'Approved' },
        { wardenId: userIdStr, 'assignedTo.warden': true, wardenStatus: 'Approved' },
        { hodId: userIdStr, 'assignedTo.hod': true, hodStatus: 'Approved' }
      ]
    });

    // Rejected: where their specific status is 'Rejected'
    const rejectedByMe = await Request.countDocuments({
      $or: [
        { mentorId: userIdStr, 'assignedTo.mentor': true, mentorStatus: 'Rejected' },
        { wardenId: userIdStr, 'assignedTo.warden': true, wardenStatus: 'Rejected' },
        { hodId: userIdStr, 'assignedTo.hod': true, hodStatus: 'Rejected' }
      ]
    });

    res.json({
      total: totalAssigned,
      pending: pendingApproval,
      approved: approvedByMe,
      rejected: rejectedByMe
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new request
// @route   POST /api/requests
// @access  Private
const createRequest = async (req, res) => {
  try {
    const { requestType, title, description, fromDate, toDate, fromTime, toTime, goingOut } = req.body;
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const assignedTo = {
      mentor: false,
      warden: false,
      hod: false,
    };

    const isHosteller = user.residentialStatus === 'Hosteller';

    // Handle File Upload for On Duty
    let proofFile = null;
    if (requestType === 'On Duty') {
      if (!req.file && user.role === 'student') {
        return res.status(400).json({ message: 'Proof document is required for On Duty request' });
      }
      if (req.file) {
        proofFile = `/uploads/proofs/${req.file.filename}`;
      }
    }

    if (user.role === 'student') {
      if (requestType === 'Leave' || requestType === 'On Duty') {
        if (isHosteller) {
          assignedTo.mentor = true;
        } else {
          assignedTo.mentor = true;
        }
      } else if (requestType === 'Emergency Leave') {
        if (isHosteller) {
          assignedTo.warden = true;
        } else {
          assignedTo.mentor = true;
        }
      } else if (requestType === 'Other') {
        assignedTo.mentor = true;
      } else if (requestType === 'Event') {
        assignedTo.mentor = true;
      }
    } else {
      assignedTo.hod = true;
    }

    const mentor = user.mentorId ? await User.findOne({ userId: user.mentorId }) : null;
    const warden = user.wardenId ? await User.findOne({ userId: user.wardenId }) : null;
    const hod = user.hodId ? await User.findOne({ userId: user.hodId }) : null;

    if (user.role !== 'student' && !user.hodId) {
      return res.status(400).json({ message: 'HOD not assigned to this staff member' });
    }

    // --- LEAVE OVERLAP VALIDATION (SMART LOGIC) ---
    const parseDateTime = (dateStr, timeStr) => {
      if (!dateStr || !timeStr) return null;
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    };

    const newStart = parseDateTime(fromDate, fromTime);
    const newEnd = parseDateTime(toDate, toTime);

    if (newStart && newEnd) {
      const overlappingRequests = await Request.find({
        userId: user._id,
        status: { $ne: 'Rejected' },
        $and: [
          { fromDate: { $lte: toDate } },
          { toDate: { $gte: fromDate } }
        ]
      });

      for (const existing of overlappingRequests) {
        const existingStart = parseDateTime(existing.fromDate, existing.fromTime);
        const existingEnd = parseDateTime(existing.toDate, existing.toTime);

        if (existingStart && existingEnd) {
          // Overlap Condition: newStart < existingEnd AND newEnd > existingStart
          if (newStart < existingEnd && newEnd > existingStart) {
            return res.status(400).json({ 
              message: '⚠️ Leave overlaps with an existing request. Please choose a different time.' 
            });
          }
        }
      }
    }
    // ----------------------------------------------

    const request = await Request.create({
      userId: user._id,
      requesterId: user.userId,
      staffId: user.role !== 'student' ? user.userId : undefined,
      role: user.role !== 'student' ? user.staffType : 'student',
      requesterRole: user.role,
      requesterStaffType: user.staffType,
      name: user.name,
      gender: user.gender,
      residentialStatus: user.residentialStatus,
      email: user.email,
      department: user.department,
      requestType,
      title,
      description,
      fromDate,
      toDate,
      fromTime,
      toTime,
      mentorId: user.mentorId,
      mentorName: mentor ? mentor.name : 'N/A',
      wardenId: user.wardenId,
      wardenName: warden ? warden.name : 'N/A',
      hodId: user.hodId,
      hodName: hod ? hod.name : 'N/A',
      assignedTo,
      venue: req.body.venue,
      accommodation: req.body.accommodation,
      goingOut: goingOut || 'No',
      proofFile: proofFile,
      mentorStatus: (user.role === 'student' && requestType === 'Emergency Leave' && isHosteller) ? 'Approved' : 'Pending',
      finalStatus: 'Pending',
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all requests for the logged-in user
// @route   GET /api/requests/my
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get requests assigned to the logged-in user for approval / security view
// @route   GET /api/requests/assigned
// @access  Private (Staff/HOD/Security)
const getAssignedRequests = async (req, res) => {
  try {
    const userIdStr = req.user.userId;
    const userRole = req.user.role;
    const securityType = req.user.securityType;

    let filter = {};

    if (userRole === 'security') {
      if (securityType === 'Main Gate') {
         // Main Gate sees: 
         // 1. Requests forwarded from Hostel Security
         // 2. Approved Dayscholar requests (they bypass Hostel)
         // 3. Requests currently 'Out' (for return verification)
         filter = { 
           $or: [
             { hostelForwarded: true, status: 'Forwarded to Gate' }, 
             { status: 'Out' },
             { status: 'Approved' } 
           ] 
         };
      } else {
         // Hostel Security sees all 'Approved' student requests
         filter = { status: 'Approved', requesterRole: 'student' };
      }
    } else {
      filter = {
        $or: [
          { mentorId: userIdStr, 'assignedTo.mentor': true },
          { wardenId: userIdStr, 'assignedTo.warden': true },
          { hodId: userIdStr, 'assignedTo.hod': true }
        ]
      };
    }

    let requests = await Request.find(filter).sort({ createdAt: -1 });

    // Enforce dynamic logic for strictly segregated Hostels and Main Gate routing
    if (userRole === 'security') {
       if (securityType === 'Boys Hostel') {
          // Only Hostellers, Skip 'Other' and 'Event' type (Event has no security)
          requests = requests.filter(r => 
            (r.requestType === 'Leave' || r.requestType === 'On Duty' || r.requestType === 'Emergency Leave') && 
            r.gender && r.gender.toLowerCase() === 'male' && 
            r.residentialStatus === 'Hosteller'
          );
       } else if (securityType === 'Girls Hostel') {
          // Only Hostellers, Skip 'Other' and 'Event' type (Event has no security)
          requests = requests.filter(r => 
            (r.requestType === 'Leave' || r.requestType === 'On Duty' || r.requestType === 'Emergency Leave') && 
            r.gender && r.gender.toLowerCase() === 'female' && 
            r.residentialStatus === 'Hosteller'
          );
       } else if (securityType === 'Main Gate') {
          // Main Gate sees: 
          // 1. Forwarded Hosteller leaves
          // 2. Out status (for verification on return)
          // 3. Approved Dayscholar EMERGENCY LEAVE only. Leave/OD Event/Other bypass security.
          // 4. APPROVED Warden requests with goingOut: 'Yes'
           requests = requests.filter(r => 
            r.status === 'Forwarded to Gate' || 
            r.status === 'Out' || 
            (r.status === 'Approved' && r.residentialStatus === 'Dayscholar' && r.requestType === 'Emergency Leave') ||
            (r.status === 'Approved' && r.requesterRole === 'staff' && r.requesterStaffType === 'Warden' && (r.requestType === 'Leave' || r.requestType === 'On Duty') && r.goingOut === 'Yes')
          );
       }
    }

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a request
// @route   PUT /api/requests/:id/approve
// @access  Private (Staff/HOD)
const approveRequest = async (req, res) => {
  try {
    const { remarks } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Admin cannot approve or reject
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admin cannot approve/reject requests' });
    }

    const userIdStr = req.user.userId;

    if (request.mentorId === userIdStr && request.assignedTo.mentor) {
      request.mentorStatus = 'Approved';
      request.mentorRemarks = remarks || '';
      
      // SHIFT ASSIGNMENT
      request.assignedTo.mentor = false;
      
      if (request.requesterRole === 'student') {
        const isHosteller = request.residentialStatus === 'Hosteller';
        
        if ((request.requestType === 'Leave' || request.requestType === 'On Duty') && isHosteller && request.wardenId) {
          // Rule: Hosteller Leave/OD: Mentor -> Warden
          request.assignedTo.warden = true;
          request.status = 'Pending';
          request.finalStatus = 'Pending';
        } else if (request.requestType === 'Event' && request.hodId) {
          // Rule: Event: Mentor -> HOD
          request.assignedTo.hod = true;
          request.status = 'Pending';
          request.finalStatus = 'Pending';
        } else {
          // Rules: 
          // 1. Dayscholar Leave/OD: Mentor only -> Approved
          // 2. Dayscholar Emergency: Mentor only -> Approved
          // 3. Other: Mentor only -> Approved
          request.status = 'Approved';
          request.finalStatus = 'Approved';
        }
      } else {
         // Staff request approved by mentor
         request.status = 'Approved';
         request.finalStatus = 'Approved';
      }
    } else if (request.wardenId === userIdStr && request.assignedTo.warden) {
      request.wardenStatus = 'Approved';
      request.wardenRemarks = remarks || '';
      
      // SHIFT ASSIGNMENT
      request.assignedTo.warden = false;
      request.status = 'Approved';
      request.finalStatus = 'Approved';
    } else if (request.hodId === userIdStr && request.assignedTo.hod) {
      request.hodStatus = 'Approved';
      request.hodRemarks = remarks || '';
      
      // SHIFT ASSIGNMENT
      request.assignedTo.hod = false;
      request.status = 'Approved';
      request.finalStatus = 'Approved';
    } else {
      return res.status(403).json({ message: 'Not authorized to approve this request' });
    }

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a request
// @route   PUT /api/requests/:id/reject
// @access  Private (Staff/HOD)
const rejectRequest = async (req, res) => {
  try {
    const { remarks } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Admin cannot approve or reject
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admin cannot approve/reject requests' });
    }

    const userIdStr = req.user.userId;

    if (request.mentorId === userIdStr && request.assignedTo.mentor) {
      request.mentorStatus = 'Rejected';
      request.mentorRemarks = remarks || '';
    } else if (request.wardenId === userIdStr && request.assignedTo.warden) {
      request.wardenStatus = 'Rejected';
      request.wardenRemarks = remarks || '';
    } else if (request.hodId === userIdStr && request.assignedTo.hod) {
      request.hodStatus = 'Rejected';
      request.hodRemarks = remarks || '';
    } else {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    request.status = 'Rejected';
    request.finalStatus = 'Rejected';
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stats for HOD
// @route   GET /api/requests/hod/stats
// @access  Private (HOD)
const getHODStats = async (req, res) => {
  try {
    const userIdStr = req.user.userId;
    const stats = await Request.aggregate([
      { $match: { hodId: userIdStr, 'assignedTo.hod': true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$hodStatus', 'Pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$hodStatus', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$hodStatus', 'Rejected'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, pending: 0, approved: 0, rejected: 0 };
    delete result._id;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get requests assigned to HOD (Pending only for dashboard)
// @route   GET /api/requests/hod
// @access  Private (HOD)
const getHODRequests = async (req, res) => {
  try {
    const userIdStr = req.user.userId;
    const requests = await Request.find({
      hodId: userIdStr,
      'assignedTo.hod': true,
      hodStatus: 'Pending'
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all requests (Admin)
// @route   GET /api/requests
// @access  Private (Admin)
// Helper for Gate Status Calculation (Strict Applicability)
const getGateStatus = (req) => {
  // 1. Basic Approval Requirement
  const isApproved = ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status) || req.finalStatus === 'Approved';
  if (!isApproved) return 'Not Applicable';

  // 2. Specialized Visibility/Applicability Logic (Sync with Dashboards)
  const isStudent = req.requesterRole === 'student';
  const isWarden = req.requesterStaffType === 'Warden' || req.role === 'Warden';
  const type = req.requestType;
  
  let isApplicable = false;

  if (isStudent) {
    // Condition from MyRequest.jsx
    if (req.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(type)) {
      isApplicable = true;
    } else if (req.residentialStatus === 'Dayscholar' && type === 'Emergency Leave') {
      isApplicable = true;
    }
  } else if (isWarden) {
    // Condition from MyStaffRequest.jsx
    if (req.goingOut === 'Yes') {
      isApplicable = true;
    }
  }

  if (!isApplicable) return 'Not Applicable';

  // 3. Physical State Derivation
  if (req.entryTime) return 'Returned';
  if (req.exitTime) return 'Out';
  if (req.otp && !req.isOtpUsed) return 'OTP Generated';
  if (!req.otp) return 'Waiting for OTP';

  return 'Not Applicable';
};

// @desc    Get all requests (Admin)
// @route   GET /api/requests
// @access  Private (Admin)
const getAdminRequests = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 0;
    const { status, department, role, type, search } = req.query;

    let query = {};

    // 1. Status Filter
    if (status && status !== 'All' && status !== 'undefined') {
      if (status === 'Approved') {
        query.$or = [
          { status: { $in: ['Approved', 'Forwarded to Gate', 'Out', 'Inside'] } },
          { finalStatus: 'Approved' }
        ];
      } else {
        query.$or = [
          { status: status },
          { finalStatus: status }
        ];
      }
    }

    // 2. Department Filter
    if (department && department !== 'All' && department !== 'undefined') {
      query.department = department;
    }

    // 3. Role Filter
    if (role && role !== 'All' && role !== 'undefined') {
      if (role === 'Student') {
        query.requesterRole = 'student';
      } else if (role === 'Staff') {
        query.requesterRole = 'staff';
        query.requesterStaffType = { $ne: 'Warden' };
      } else if (role === 'Warden') {
        query.requesterRole = 'staff';
        query.requesterStaffType = 'Warden';
      }
    }

    // 4. Type Filter
    if (type && type !== 'All' && type !== 'undefined') {
      // Map frontend 'Emergency' to backend 'Emergency Leave'
      const mappedType = type === 'Emergency' ? 'Emergency Leave' : type;
      query.requestType = mappedType;
    }

    // 5. Search Logic (ID Only - Search both student/staff ID fields)
    if (search && search !== 'undefined') {
      const searchTerms = [
        { requesterId: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
      
      // Merge with existing $or (from status filter) if it exists
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchTerms }
        ];
        delete query.$or;
      } else {
        query.$or = searchTerms;
      }
    }

    const requests = await Request.find(query).sort({ createdAt: -1 }).limit(limit);
    
    // Add dynamic gateStatus to each request
    const requestsWithGateStatus = requests.map(r => ({
      ...r.toObject(),
      gateStatus: getGateStatus(r)
    }));

    res.json(requestsWithGateStatus);
  } catch (error) {
    console.error('Error in getAdminRequests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get request stats (Admin)
// @route   GET /api/requests/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$finalStatus', 'Pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$finalStatus', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$finalStatus', 'Rejected'] }, 1, 0] } },
        },
      },
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, pending: 0, approved: 0, rejected: 0 };
    delete result._id;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forward to gate
// @route   POST /api/requests/:id/forward-to-gate
// @access  Private (Security)
const forwardToGate = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.hostelForwarded = true;
    request.status = 'Forwarded to Gate';
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate OTP
// @route   POST /api/requests/:id/otp/generate
// @access  Private (Security)
const generateOTP = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // Rule: BLOCK OTP generation IF: isOtpUsed = true AND they are NOT 'Out'
    if (request.isOtpUsed && request.status !== 'Out') {
      return res.status(400).json({ message: 'OTP already used. Cannot regenerate' });
    }

    const { otpType } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    request.otp = otp;
    request.otpExpiry = new Date(Date.now() + 60 * 1000); // 1 min expiration
    request.isOtpUsed = false;
    request.otpType = otpType || 'out';
    
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify OTP
// @route   POST /api/requests/:id/otp/verify
// @access  Private (Security)
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.isOtpUsed) {
      return res.status(400).json({ message: 'OTP already used' });
    }

    if (!request.otp || request.otp !== otp) {
      return res.status(400).json({ message: 'Invalid or Expired OTP. Please try again' });
    }

    if (new Date() > new Date(request.otpExpiry)) {
      return res.status(400).json({ message: 'Invalid or Expired OTP. Please try again' });
    }

    // Set isOtpUsed = true
    request.isOtpUsed = true;
    
    // Gate logic: IF exitTime not set -> Save exitTime (Gate Out) ELSE -> Save entryTime (Gate In)
    if (!request.exitTime) {
      request.status = 'Out';
      request.exitTime = new Date();
    } else {
      request.status = 'Inside';
      request.entryTime = new Date();
    }

    await request.save();
    res.json({ message: 'OTP Verified Successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // RBAC: Check if user is authorized to see this request
    const isOwner = request.userId.toString() === req.user._id.toString();
    const isStaff = ['staff', 'hod', 'admin'].includes(req.user.role);
    const isAssignedStaff = (
      request.mentorId === req.user.userId || 
      request.wardenId === req.user.userId || 
      request.hodId === req.user.userId
    );
    const isSecurity = req.user.role === 'security';

    if (isOwner || isStaff || isSecurity) {
      return res.json(request);
    }

    return res.status(403).json({ message: 'Not authorized to view this request' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getRequestAnalytics = async (req, res) => {
  try {
    const [deptStats, studentStats, staffStats, typeStats, statusStats] = await Promise.all([
      // 1. Department Stats
      Request.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $project: { name: { $ifNull: ["$_id", "N/A"] }, value: "$count", _id: 0 } },
        { $sort: { value: -1 } }
      ]),
      // 2. Student Sub-Role (Residency)
      Request.aggregate([
        { $match: { requesterRole: 'student' } },
        { $group: { _id: "$residentialStatus", value: { $sum: 1 } } },
        { $project: { name: { $ifNull: ["$_id", "Unknown"] }, value: 1, _id: 0 } }
      ]),
      // 3. Staff Sub-Role
      Request.aggregate([
        { $match: { requesterRole: 'staff' } },
        { $group: { _id: "$requesterStaffType", value: { $sum: 1 } } },
        { $project: { name: { $ifNull: ["$_id", "Other Staff"] }, value: 1, _id: 0 } }
      ]),
      // 4. Type Stats
      Request.aggregate([
        { $group: { _id: "$requestType", count: { $sum: 1 } } },
        { $project: { name: { $ifNull: ["$_id", "Other"] }, value: "$count", _id: 0 } }
      ]),
      // 5. Status Stats
      Request.aggregate([
        { $match: { status: { $in: ['Pending', 'Approved', 'Rejected'] } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { name: "$_id", value: "$count", _id: 0 } }
      ])
    ]);

    // 6. Temporal Trends (Weekly/Monthly)
    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));

    const trendData = await Request.aggregate([
      { $match: { submittedDate: { $gte: sixMonthsAgo } } },
      {
        $facet: {
          monthly: [
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$submittedDate" } }, value: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          weekly: [
            { $group: { _id: { $dateToString: { format: "%Y-W%V", date: "$submittedDate" } }, value: { $sum: 1 } } },
            { $sort: { _id: 1 } },
            { $limit: 12 }
          ]
        }
      }
    ]);

    res.json({
      departmentStats: deptStats,
      studentStats,
      staffStats,
      typeStats,
      statusStats,
      weeklyTrend: trendData[0].weekly.map(w => ({ name: w._id.split('-').pop(), value: w.value })),
      monthlyTrend: trendData[0].monthly.map(m => ({ name: new Date(m._id).toLocaleString('default', { month: 'short' }), value: m.value }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    await request.deleteOne();
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
  getAdminRequests,
  getAdminStats,
  forwardToGate,
  generateOTP,
  verifyOTP,
  deleteRequest,
  getRequestById,
  getRequestAnalytics,
  getSecureProof
};

/**
 * @desc    Get secure proof file with RBAC
 * @route   GET /api/requests/proof/:filename
 * @access  Private
 */
async function getSecureProof(req, res) {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', 'proofs', filename);

    // Find the request associated with this file
    const request = await Request.findOne({ proofFile: `/uploads/proofs/${filename}` });

    if (!request) {
      return res.status(404).json({ message: 'Proof document not found or invalid path' });
    }

    // RBAC: Check if user is authorized to see this file
    const isOwner = request.userId.toString() === req.user._id.toString();
    const isStaff = ['staff', 'hod', 'admin'].includes(req.user.role);
    const isAssignedStaff = (
      request.mentorId === req.user.userId || 
      request.wardenId === req.user.userId || 
      request.hodId === req.user.userId
    );
    const isSecurity = req.user.role === 'security';

    if (isOwner || (isStaff && isAssignedStaff) || req.user.role === 'admin') {
      return res.sendFile(filePath);
    }

    return res.status(403).json({ message: 'Not authorized to access this document' });
  } catch (error) {
    console.error('Error serving secure proof:', error);
    res.status(500).json({ message: 'Server error serving document' });
  }
}
