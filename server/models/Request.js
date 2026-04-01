const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterId: {
      type: String,
      required: true,
    },
    requesterRole: {
      type: String,
      required: true,
    },
    requesterStaffType: {
      type: String, // Mentor, Warden, Staff
    },
    staffId: {
      type: String,
    },
    role: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    gender: String,
    residentialStatus: String,
    email: {
      type: String,
    },
    department: String,
    requestType: {
      type: String,
      required: true,
      enum: ['Leave', 'On Duty', 'Emergency Leave', 'Other', 'Event'],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    fromDate: String,
    toDate: String,
    fromTime: String,
    toTime: String,
    venue: String,
    accommodation: String,
    goingOut: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Forwarded to Gate', 'Out', 'Inside'],
      default: 'Pending',
    },
    mentorStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    wardenStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    hodStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    assignedTo: {
      mentor: { type: Boolean, default: false },
      warden: { type: Boolean, default: false },
      hod: { type: Boolean, default: false },
    },
    mentorRemarks: { type: String, default: '' },
    wardenRemarks: { type: String, default: '' },
    hodRemarks: { type: String, default: '' },
    mentorId: String,
    mentorName: String,
    wardenId: String,
    wardenName: String,
    hodId: String,
    hodName: String,
    finalStatus: {
      type: String,
      default: 'Pending',
    },
    hostelForwarded: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    isOtpUsed: { type: Boolean, default: false },
    otpType: { type: String, enum: ['out', 'in'], default: 'out' },
    proofFile: { type: String },
    exitTime: { type: Date },
    entryTime: { type: Date },
    submittedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Request', requestSchema);
