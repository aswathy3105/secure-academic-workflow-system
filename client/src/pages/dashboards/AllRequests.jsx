import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  FileText,
  User as UserIcon,
  X,
  ExternalLink,
  Download,
  Layout,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnalyticsDashboard from './AnalyticsDashboard';

const AllRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [departments, setDepartments] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeView, setActiveView] = useState('table');

  const handleViewRequest = async (requestId) => {
    setModalLoading(true);
    setSelectedRequest({ _id: requestId });
    try {
      const response = await api.get(`/requests/${requestId}`);
      setSelectedRequest(response.data);
    } catch (error) {
      toast.error('Error fetching request details');
      setSelectedRequest(null);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get(`/requests?status=${statusFilter}&department=${deptFilter}&role=${roleFilter}&type=${typeFilter}&search=${searchTerm}`);
      setRequests(response.data);
    } catch (error) {
      toast.error('Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await api.get('/users/departments');
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments');
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchRequests(false);
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [searchTerm, statusFilter, deptFilter, roleFilter, typeFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests(true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, deptFilter, roleFilter, typeFilter]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/requests/${id}/approve`);
      toast.success('Request approved successfully');
      fetchRequests();
    } catch (error) {
      toast.error('Error approving request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/requests/${id}/reject`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Error rejecting request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error) {
      toast.error('Error deleting request');
    }
  };

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="All Workflow Requests" />
      
      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Modern View Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-2">
           <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-2xl">
              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeView === 'table' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Layout size={14} strokeWidth={3} /> Request Stream
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeView === 'analytics' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BarChart2 size={14} strokeWidth={3} /> Live Intelligence
              </button>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono">
               System Status: <span className="text-slate-300">Synchronized</span>
             </p>
           </div>
        </div>

        {activeView === 'table' ? (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col space-y-4 bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative group w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by ID only..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-1.5">
                    <Filter className="h-3 w-3 text-primary-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-300 focus:outline-none cursor-pointer py-2"
                    >
                      <option value="All">Status: All</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-1.5">
                    <UserIcon className="h-3 w-3 text-primary-500" />
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-300 focus:outline-none cursor-pointer py-2"
                    >
                      <option value="All">Role: All</option>
                      <option value="Student">Student</option>
                      <option value="Staff">Staff</option>
                      <option value="Warden">Warden</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-1.5">
                    <FileText className="h-3 w-3 text-primary-500" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-300 focus:outline-none cursor-pointer py-2"
                    >
                      <option value="All">Type: All</option>
                      <option value="Leave">Leave</option>
                      <option value="On Duty">On Duty</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Event">Event</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-1.5">
                    <AlertCircle className="h-3 w-3 text-primary-500" />
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-300 focus:outline-none cursor-pointer py-2"
                    >
                      <option value="All">Dept: All</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                      <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest bg-slate-950/50">ID</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest bg-slate-950/50 text-center">Type</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest bg-slate-950/50">Role</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest bg-slate-950/50 text-center">Status</th>
                      <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest bg-slate-950/50 text-center">Gate Status</th>
                      <th className="px-8 py-4 font-bold text-[10px] uppercase tracking-widest bg-slate-950/50 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loading ? (
                      [...Array(6)].map((_, i) => (
                        <tr key={i} className="animate-pulse text-center">
                          <td colSpan={6} className="px-8 py-5 h-20 bg-slate-900/10"></td>
                        </tr>
                      ))
                    ) : (
                      requests.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-800/30 transition-all group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono font-bold text-white uppercase tracking-tighter">#{r.requesterId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              r.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              r.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              'bg-slate-500/10 text-slate-400 border border-slate-800'
                            }`}>
                              {r.requestType}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-200 capitalize tracking-wide">
                                {r.requesterRole === 'student' ? 'Student' : 
                                 `Staff (${r.requesterStaffType || 'Regular Staff'})`}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-none mt-1">{r.department || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${
                              r.gateStatus === 'Returned' ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-lg shadow-green-500/10' :
                              r.gateStatus === 'Out' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-lg shadow-orange-500/10' :
                              r.gateStatus === 'OTP Generated' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-lg shadow-blue-500/10' :
                              r.gateStatus === 'Waiting for OTP' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-lg shadow-yellow-500/10' :
                              'bg-slate-950/40 text-slate-600 border-slate-800'
                            }`}>
                              {r.gateStatus}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 transition-all">
                              <button
                                onClick={() => handleViewRequest(r._id)}
                                className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-lg shadow-black/20"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(r._id)}
                                className="p-2 bg-red-950/20 border border-red-900/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-black/20"
                                title="Delete Request"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {!loading && requests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">
                          No requests found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <AnalyticsDashboard />
        )}
      </main>

      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRequest(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              {modalLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                   <div className="h-12 w-12 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
                   <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Fetching Live Details...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight leading-none">{selectedRequest.title || 'Request Details'}</h2>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                          selectedRequest.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          selectedRequest.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-primary-500/10 text-primary-500 border-primary-500/20'
                        }`}>
                          {selectedRequest.requestType}
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg font-mono bg-slate-950/50">
                          {selectedRequest.requesterRole === 'student' ? 'Student Request' : `Staff Request (${selectedRequest.requesterStaffType || 'Regular'})`}
                        </span>
                        <span className="text-slate-700 text-[9px] font-black uppercase tracking-widest font-mono">
                          #{selectedRequest._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedRequest(null)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all group">
                      <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  <div className="space-y-8 text-left">
                    {/* SECTION 1: BASIC DESCRIPTION */}
                    <div className="bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50 shadow-inner group transition-all hover:bg-slate-950/40">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <FileText size={12} className="text-primary-500" /> Purpose Description
                       </h4>
                       <p className="text-sm text-slate-300 italic leading-relaxed font-serif">"{selectedRequest.description}"</p>
                    </div>

                    {/* SECTION 2 & 3: GRID LAYOUT (IDENTITY & TEMPORAL) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Requester Information (Role-Aware) */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase font-mono">
                          <UserIcon size={14} className="text-primary-500" /> 
                          {selectedRequest.requesterRole === 'student' ? 'Student Identity' : 'Requester Profile'}
                        </h4>
                        <div className="bg-slate-950/20 p-6 rounded-3xl border border-slate-800/30 space-y-4 shadow-sm hover:border-slate-700/50 transition-all">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Full Name</p>
                              <p className="text-sm text-white font-bold">{selectedRequest.name}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">ID Number</p>
                              <p className="text-sm text-white font-mono">{selectedRequest.requesterId || selectedRequest.staffId}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Department</p>
                              <p className="text-xs text-slate-300 font-medium">{selectedRequest.department || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Email Contact</p>
                              <p className="text-[10px] text-slate-400 font-medium break-all">{selectedRequest.email || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/30">
                            {/* IF STUDENT: Show Mentor/Warden fields */}
                            {selectedRequest.requesterRole === 'student' ? (
                              <>
                                <div>
                                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Assigned Mentor</p>
                                  <p className="text-xs text-white font-bold">{selectedRequest.mentorName || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Hostel Warden</p>
                                  <p className="text-xs text-white font-bold">{selectedRequest.wardenName || 'N/A'}</p>
                                </div>
                              </>
                            ) : (
                              /* IF STAFF: Show HOD and Role fields */
                              <>
                                <div>
                                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Assigned HOD</p>
                                  <p className="text-xs text-white font-bold">{selectedRequest.hodName || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Status</p>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedRequest.requesterStaffType || 'Staff'}</p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              {selectedRequest.requesterRole === 'student' && (
                                <>
                                  <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">HOD Name</p>
                                  <p className="text-xs text-white font-bold">{selectedRequest.hodName || 'N/A'}</p>
                                </>
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Submission Date</p>
                              <p className="text-xs text-slate-400 font-bold italic">{new Date(selectedRequest.submittedDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date & Time */}
                      {selectedRequest.requestType !== 'Other' && (
                        <div className="space-y-6">
                           <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase font-mono">
                            <Clock size={14} className="text-primary-500" /> Temporal Context
                          </h4>
                          <div className="bg-slate-950/20 p-6 rounded-3xl border border-slate-800/30 flex flex-col justify-center h-[calc(100%-2rem)]">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                               <div>
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 font-mono">From Date</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.fromDate}</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 font-mono">To Date</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.toDate}</p>
                               </div>
                               <div className="pt-4 border-t border-slate-800/30">
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 font-mono">From Time</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.fromTime}</p>
                               </div>
                               <div className="text-right pt-4 border-t border-slate-800/30">
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 font-mono">To Time</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.toTime}</p>
                               </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TYPE-WISE RENDERING (STATUS & REMARKS) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/50">
                       {/* STATUS CARDS */}
                       <div className="space-y-4 md:col-span-1">
                          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">Workflow Hierarchy</h4>
                          <div className="space-y-3">
                             {/* IF STUDENT: Show Mentor/Warden/HOD chain */}
                             {selectedRequest.requesterRole === 'student' ? (
                               <>
                                 {!(selectedRequest.residentialStatus === 'Hosteller' && selectedRequest.requestType === 'Emergency Leave') && (
                                   <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center text-xs">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mentor</span>
                                      <span className={`text-[10px] font-black uppercase ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</span>
                                   </div>
                                 )}

                                 {(selectedRequest.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) && (
                                   <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center text-xs">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Warden</span>
                                      <span className={`text-[10px] font-black uppercase ${selectedRequest.wardenStatus === 'Approved' ? 'text-green-500' : selectedRequest.wardenStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.wardenStatus}</span>
                                   </div>
                                 )}

                                 {selectedRequest.requestType === 'Event' && (
                                   <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center text-xs">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">HOD</span>
                                      <span className={`text-[10px] font-black uppercase ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus || 'Pending'}</span>
                                   </div>
                                 )}
                               </>
                             ) : (
                               /* IF STAFF: Show HOD and Warden-Specific fields */
                               <>
                                 <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center text-xs">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">HOD Approval</span>
                                    <span className={`text-[10px] font-black uppercase ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus || 'Pending'}</span>
                                 </div>

                                 {selectedRequest.requesterStaffType === 'Warden' && (
                                   <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center text-xs">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Going Out</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${selectedRequest.goingOut === 'Yes' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                        {selectedRequest.goingOut || 'No'}
                                      </span>
                                   </div>
                                 )}
                               </>
                             )}

                             <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/20 flex justify-between items-center">
                                <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest font-mono">Final Decision</span>
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.finalStatus || selectedRequest.status) ? 'bg-green-500/20 text-green-500 border-green-500/20' :
                                  ['Rejected'].includes(selectedRequest.finalStatus || selectedRequest.status) ? 'bg-red-500/20 text-red-500 border-red-500/20' :
                                  'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                                }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.finalStatus || selectedRequest.status) ? 'Approved' : (selectedRequest.finalStatus || selectedRequest.status)}</span>
                             </div>
                          </div>
                       </div>

                       {/* REMARKS CARDS */}
                       <div className="space-y-4 md:col-span-2">
                          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono text-center">Protocol Remarks</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {/* IF STUDENT: Show Mentor/Warden remarks */}
                             {selectedRequest.requesterRole === 'student' ? (
                               <>
                                 {!(selectedRequest.residentialStatus === 'Hosteller' && selectedRequest.requestType === 'Emergency Leave') && (
                                   <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                                      <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 font-mono text-primary-500/50 text-[8px]">Mentor Remarks</p>
                                      <p className="text-xs text-slate-300 italic">"{selectedRequest.mentorRemarks || 'No remarks provided'}"</p>
                                   </div>
                                 )}
                                 {(selectedRequest.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) && (
                                   <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                                      <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 font-mono text-primary-500/50 text-[8px]">Warden Remarks</p>
                                      <p className="text-xs text-slate-300 italic">"{selectedRequest.wardenRemarks || 'No remarks provided'}"</p>
                                   </div>
                                 )}
                               </>
                             ) : (
                               /* IF STAFF: Show HOD remarks exclusively */
                               <div className="col-span-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 font-mono text-primary-500/50 text-[8px]">HOD Remarks</p>
                                  <p className="text-xs text-slate-300 italic">"{selectedRequest.hodRemarks || 'No remarks provided'}"</p>
                               </div>
                             )}

                             {/* HOD Remarks for Student Events */}
                             {(selectedRequest.requesterRole === 'student' && selectedRequest.requestType === 'Event') && (
                               <div className="col-span-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner mt-2">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 font-mono text-primary-500/50 text-[8px]">HOD Remarks (Event)</p>
                                  <p className="text-xs text-slate-300 italic">"{selectedRequest.hodRemarks || 'No remarks provided'}"</p>
                               </div>
                             )}
                          </div>
                          
                          {/* Event Specialized Details */}
                          {selectedRequest.requestType === 'Event' && (
                             <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/10 flex flex-col items-center">
                                   <span className="text-[9px] font-black text-primary-500 uppercase mb-1 font-mono">Location/Venue</span>
                                   <span className="text-xs font-bold text-white uppercase tracking-tighter">{selectedRequest.venue || 'N/A'}</span>
                                </div>
                                <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/10 flex flex-col items-center">
                                   <span className="text-[9px] font-black text-primary-500 uppercase mb-1 font-mono">Hostel Stay</span>
                                   <span className="text-xs font-bold text-white uppercase tracking-tighter">{selectedRequest.accommodation || 'No'}</span>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>

                    {/* GATE TRACKING SECTION (ROLE-AWARE) */}
                    {((selectedRequest.requesterRole === 'student' && 
                       ((selectedRequest.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) ||
                        (selectedRequest.residentialStatus === 'Dayscholar' && selectedRequest.requestType === 'Emergency Leave'))) ||
                      (selectedRequest.requesterStaffType === 'Warden' && selectedRequest.goingOut === 'Yes')) && (
                      <div className="bg-slate-950/50 border border-slate-800/50 rounded-[2.5rem] p-8 space-y-6 shadow-inner group transition-all hover:bg-slate-950/60 mt-4">
                         <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                               <Layout size={14} className="text-primary-500 animate-pulse" /> Security Protocol Context
                            </h4>
                            <span className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] bg-primary-500/10 px-3 py-1 rounded-full">Gate Tracking Active</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/30 group/item hover:border-purple-500/30 transition-all">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block font-mono group-hover/item:text-primary-500 transition-colors">Gate Out</span>
                               <span className="text-xs font-black text-purple-400 uppercase tracking-tighter block mb-1">
                                 {selectedRequest.exitTime ? new Date(selectedRequest.exitTime).toLocaleDateString() : 'Not Recorded'}
                               </span>
                               <span className="text-[10px] font-black text-slate-400 font-mono">
                                 {selectedRequest.exitTime ? new Date(selectedRequest.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                               </span>
                            </div>
                            <div className="text-center bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/30 group/item hover:border-teal-500/30 transition-all">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block font-mono group-hover/item:text-primary-500 transition-colors">Gate In</span>
                               <span className="text-xs font-black text-teal-400 uppercase tracking-tighter block mb-1">
                                 {selectedRequest.entryTime ? new Date(selectedRequest.entryTime).toLocaleDateString() : 'Not Recorded'}
                               </span>
                               <span className="text-[10px] font-black text-slate-400 font-mono">
                                 {selectedRequest.entryTime ? new Date(selectedRequest.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                               </span>
                            </div>
                            <div className={`p-6 rounded-[2rem] border flex flex-col items-center justify-center transition-all ${selectedRequest.otp && !selectedRequest.isOtpUsed ? 'bg-primary-500/10 border-primary-500/20 shadow-lg shadow-primary-500/10 animate-pulse' : 'bg-slate-950/40 border-slate-800/40 opacity-50'}`}>
                               <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-2 font-mono">Verification OTP</span>
                               <span className={`text-2xl font-black tracking-[0.2em] font-mono ${selectedRequest.otp && !selectedRequest.isOtpUsed ? 'text-white' : 'text-slate-600'}`}>
                                 {selectedRequest.isOtpUsed ? 'Used' : (selectedRequest.otp || 'N/A')}
                               </span>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* DOCUMENT VIEW SECTION */}
                    {(['On Duty', 'Event'].includes(selectedRequest.requestType)) && (
                      <div className="pt-4">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 font-mono">Supporting Reference</h4>
                        {selectedRequest.proofFile ? (
                           <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-primary-500/30 transition-all shadow-xl">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                 </div>
                                 <div className="text-left">
                                    <p className="text-sm font-bold text-white">Encrypted Proof.pdf</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.1em] font-mono">SECURED CLOUD STORAGE</p>
                                 </div>
                              </div>
                              <div className="flex gap-2">
                                 <a 
                                   href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                                   target="_blank"
                                   className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold px-5"
                                 >
                                    <ExternalLink size={14} /> View
                                 </a>
                                 <a 
                                   href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                                   download
                                   className="p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold px-5 shadow-lg shadow-primary-600/20"
                                 >
                                    <Download size={14} /> Download
                                 </a>
                              </div>
                           </div>
                        ) : (
                          <div className="bg-slate-950/20 border-2 border-dashed border-slate-800 p-8 rounded-3xl text-center">
                             <p className="text-slate-600 font-bold italic text-sm">No documentation provided with this request</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-800 flex justify-end gap-3">
                    <button onClick={() => setSelectedRequest(null)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 text-[10px] font-black uppercase tracking-widest font-mono">
                      Close Detail
                    </button>
                    <button 
                      onClick={() => { handleDelete(selectedRequest._id); setSelectedRequest(null); }}
                      className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-600/20 flex items-center gap-3 active:scale-95 text-[10px] font-black uppercase tracking-widest font-mono group"
                    >
                      <Trash2 size={16} className="group-hover:rotate-12 transition-transform" />
                      Remove Request
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllRequests;
