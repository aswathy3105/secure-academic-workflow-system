import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Check,
  X,
  MessageSquare,
  User as UserIcon,
  Search,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const isApprover = user?.staffType === 'Mentor' || user?.staffType === 'Warden' || user?.role === 'hod';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignedRes, myRes] = await Promise.all([
          isApprover ? api.get('/requests/assigned') : Promise.resolve({ data: [] }),
          api.get('/requests/my')
        ]);
        setAssignedRequests(assignedRes.data);
        setMyRequests(myRes.data); // Load all for dashboard search/filter
      } catch (error) {
        console.error('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isApprover]);

  const handleAction = async (requestId, type) => {
    setActionLoading(true);
    try {
      if (type === 'approve') {
        await api.put(`/requests/${requestId}/approve`, { remarks });
        toast.success('Request approved successfully');
      } else {
        await api.put(`/requests/${requestId}/reject`, { remarks });
        toast.error('Request rejected');
      }
      setIsModalOpen(false);
      setRemarks('');
      // Refresh data without full reload for smoother experience
      const assignedRes = await api.get('/requests/assigned');
      setAssignedRequests(assignedRes.data);
    } catch (error) {
      toast.error('Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter for Approvers: Search + Status pending
  const pendingAssigned = assignedRequests.filter(req => {
    let matchesStatus = false;
    if (req.mentorId === user.userId) matchesStatus = req.mentorStatus === 'Pending';
    if (req.wardenId === user.userId) matchesStatus = req.wardenStatus === 'Pending';
    if (req.hodId === user.userId) matchesStatus = req.hodStatus === 'Pending';
    if (!matchesStatus) return false;

    const searchLower = searchTerm.toLowerCase();
    const shortId = req._id.slice(-6).toLowerCase();
    const matchesSearch = (req.studentId && req.studentId.toLowerCase().includes(searchLower)) ||
                          (req.requestType && req.requestType.toLowerCase().includes(searchLower)) ||
                          shortId.includes(searchLower);
    
    return matchesSearch;
  });

  // Filter for Regular Staff: Search + Status
  const filteredMyRequests = myRequests.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.requesterRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || req.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title={`${isApprover ? (user.staffType || 'HOD') : 'Staff'} Dashboard`} />
      
      <main className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.name}</h2>
            <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-widest leading-loose">
              SYSTEM CONTEXT: <span className="text-primary-500">{user?.staffType || (user?.role === 'hod' ? 'HOD' : 'TEACHING STAFF')}</span>
            </p>
          </div>
          {!isApprover && (
             <Link 
             to="/staff/requests/add"
             className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-[2rem] font-bold transition-all shadow-xl shadow-primary-600/20 active:scale-95 text-sm"
           >
             <PlusCircle size={18} /> New Request
           </Link>
          )}
        </div>

        {/* Search & Filters (FOR REGULAR STAFF) */}
        {!isApprover && (
          <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/50">
             <div className="relative flex-grow group">
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
               <input 
                type="text"
                placeholder="Search by ID, Title or Role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all placeholder:text-slate-700 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filterStatus === status ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {status}
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* Dynamic Table Section */}
        {isApprover ? (
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/50 gap-6">
              <h3 className="font-black text-xl">Dashboard</h3>
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search (ID or Type)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                    <th className="px-8 py-6 font-black">ID</th>
                    <th className="px-8 py-6 font-black text-center">Type</th>
                    <th className="px-8 py-6 font-black">Role</th>
                    <th className="px-8 py-6 font-black">Title</th>
                    <th className="px-8 py-6 font-black text-center">Date</th>
                    <th className="px-8 py-6 font-black text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30 text-sm">
                  {loading ? (
                    [...Array(3)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-8 py-6 h-20"></td></tr>)
                  ) : pendingAssigned.length > 0 ? (
                    pendingAssigned.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-800/30 transition-all group">
                        <td className="px-8 py-6 text-white font-mono text-xs font-bold tracking-tighter">#{req.requesterId}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            req.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            req.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-800'
                          }`}>
                            {req.requestType}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-slate-300 text-[10px] font-bold uppercase tracking-wide">
                          {req.requesterRole === 'student' ? 'Student' : `Staff (${req.requesterStaffType || 'Regular'})`}
                        </td>
                        <td className="px-8 py-6 text-white font-bold text-base truncate max-w-[180px]">{req.title}</td>
                        <td className="px-8 py-6 text-slate-500 font-bold text-xs">
                          {new Date(req.submittedDate).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             <button onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }} className="p-2 border border-slate-800 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 flex items-center gap-2 text-xs font-bold px-3">
                               <Eye size={14} /> View
                             </button>
                             <button disabled={actionLoading} onClick={() => handleAction(req._id, 'approve')} className="p-2 border border-green-500/20 bg-green-500/10 hover:bg-green-500 rounded-xl text-green-500 hover:text-white transition-all shadow-xl active:scale-90 flex items-center gap-2 text-xs font-bold px-3 disabled:opacity-50">
                               <Check size={14} /> Approve
                             </button>
                             <button disabled={actionLoading} onClick={() => handleAction(req._id, 'reject')} className="p-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500 rounded-xl text-red-500 hover:text-white transition-all shadow-xl active:scale-90 flex items-center gap-2 text-xs font-bold px-3 disabled:opacity-50">
                               <X size={14} /> Reject
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                           <p className="text-slate-500 font-bold italic">No assigned requests found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
             <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="font-black text-xl tracking-tighter italic uppercase">Recent Requests</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest italic">Recent Requests Table</p>
              </div>
              <Link to="/staff/requests/all" className="text-primary-500 text-sm font-black hover:underline tracking-widest uppercase">View Archive</Link>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                      <th className="px-8 py-6 font-black">ID</th>
                      <th className="px-8 py-6 font-black text-center">Type</th>
                      <th className="px-8 py-6 font-black">Role</th>
                      <th className="px-8 py-6 font-black text-center">Title</th>
                      <th className="px-8 py-6 font-black text-center">Date</th>
                      <th className="px-8 py-6 font-black text-center">Status</th>
                      <th className="px-8 py-6 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30 text-sm">
                    {loading ? (
                      [...Array(3)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-8 py-6 h-20"></td></tr>)
                    ) : filteredMyRequests.length > 0 ? (
                      filteredMyRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-800/30 transition-all group">
                          <td className="px-8 py-6 font-mono text-xs text-white font-bold tracking-tighter">#{req.requesterId}</td>
                          <td className="px-8 py-6 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              req.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              req.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-slate-500/10 text-slate-400 border-slate-800'
                            }`}>
                              {req.requestType}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-slate-300 text-[10px] font-bold uppercase tracking-wide">
                            {req.requesterRole === 'student' ? 'Student' : `Staff (${req.requesterStaffType || 'Regular'})`}
                          </td>
                          <td className="px-8 py-6 text-white font-bold text-base truncate max-w-[200px] text-center">{req.title}</td>
                          <td className="px-8 py-6 text-slate-500 font-bold text-xs text-center">{new Date(req.submittedDate).toLocaleDateString()}</td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${
                              ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status) ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status) ? 'Approved' : req.status}</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }} className="p-4 bg-slate-800 hover:bg-primary-600 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 border border-slate-700/50">
                                <Eye size={18} />
                              </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-8 py-24 text-center text-slate-500 italic font-bold">No professional submissions found matching your criteria.</td></tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </main>

      {/* Action/View Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black">{selectedRequest.title}</h2>
                  <p className="text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                    {selectedRequest.requestType} • ID #{selectedRequest._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-12">
                {selectedRequest.requestType === 'Event' ? (
                  // Specialized Event Layout
                  <div className="space-y-10">
                    {/* Approval Status Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mentor Approval Status</span>
                        <span className={`text-xs font-black uppercase ${
                          selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' :
                          selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'
                        }`}>{selectedRequest.mentorStatus}</span>
                      </div>
                      <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">HOD Approval Status</span>
                        <span className={`text-xs font-black uppercase ${
                          selectedRequest.hodStatus === 'Approved' ? 'text-green-500' :
                          selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'
                        }`}>{selectedRequest.hodStatus || 'Pending'}</span>
                      </div>
                      <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Final Status</span>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                          ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.finalStatus || selectedRequest.status) ? 'bg-green-500/20 text-green-500 border-green-500/20' :
                          ['Rejected'].includes(selectedRequest.finalStatus || selectedRequest.status) ? 'bg-red-500/20 text-red-500 border-red-500/20' :
                          'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                        }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.finalStatus || selectedRequest.status) ? 'Approved' : (selectedRequest.finalStatus || selectedRequest.status)}</span>
                      </div>
                    </div>

                    {/* Event Details Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-primary-500/5 p-6 rounded-3xl border border-primary-500/10 flex flex-col items-center">
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2">Venue Arrangement</span>
                        <span className="text-xl font-bold text-white uppercase tracking-tight">{selectedRequest.venue || 'N/A'}</span>
                      </div>
                      <div className="bg-primary-500/5 p-6 rounded-3xl border border-primary-500/10 flex flex-col items-center">
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2">Accommodation Provided</span>
                        <span className="text-xl font-bold text-white uppercase tracking-tight">{selectedRequest.accommodation || 'No'}</span>
                      </div>
                    </div>

                    {/* Remarks Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Mentor Remarks</h4>
                        <p className="text-sm text-slate-300 italic min-h-[40px]">
                          {selectedRequest.mentorRemarks ? `"${selectedRequest.mentorRemarks}"` : "No remarks provided"}
                        </p>
                      </div>
                      <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">HOD Remarks</h4>
                        <p className="text-sm text-slate-300 italic min-h-[40px]">
                          {selectedRequest.hodRemarks ? `"${selectedRequest.hodRemarks}"` : "No remarks provided"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-800/50">
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase mb-4">
                           Student Information
                        </h4>
                        <div className="space-y-4 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Name</p>
                              <p className="text-white font-medium">{selectedRequest.name}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">ID</p>
                              <p className="text-white font-medium tracking-wide">{selectedRequest.requesterId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                             <div>
                               <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Department</p>
                               <p className="text-white font-medium">{selectedRequest.department || 'N/A'}</p>
                             </div>
                             <div>
                               <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Email</p>
                               <p className="text-white font-medium break-all text-[10px]">{selectedRequest.email || 'N/A'}</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/30">
                             <div>
                               <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">Mentor</p>
                               <p className="text-[10px] text-slate-300">{selectedRequest.mentorName || 'N/A'}</p>
                             </div>
                             <div>
                               <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">Warden</p>
                               <p className="text-[10px] text-slate-300">{selectedRequest.wardenName || 'N/A'}</p>
                             </div>
                             <div>
                               <p className="text-[8px] text-slate-600 font-bold uppercase mb-1">HOD</p>
                               <p className="text-[10px] text-slate-300">{selectedRequest.hodName || 'N/A'}</p>
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase mb-4">
                           Event Schedule
                        </h4>
                        <div className="space-y-6 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50 flex flex-col justify-center shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                               <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">From</p>
                               <p className="text-sm font-black text-white">{selectedRequest.fromDate} {selectedRequest.fromTime}</p>
                             </div>
                             <div>
                               <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">To</p>
                               <p className="text-sm font-black text-white">{selectedRequest.toDate} {selectedRequest.toTime}</p>
                             </div>
                          </div>
                          <div className="pt-4 border-t border-slate-800/50 pb-2">
                             <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Submitted On</p>
                             <p className="text-[11px] text-slate-300 font-bold">{new Date(selectedRequest.submittedDate).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/30 p-8 rounded-3xl border border-slate-800/50 shadow-inner">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Reason / Description</h4>
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{selectedRequest.description}"
                      </p>
                    </div>
                  </div>
                ) : ((selectedRequest.residentialStatus?.toLowerCase().replace(/\s+/g, '') === 'dayscholar' || selectedRequest.studentId?.residentialStatus?.toLowerCase().replace(/\s+/g, '') === 'dayscholar') && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) ? (
                  // SPECIALIZED DAYSCHOLAR LEAVE/OD/EMERGENCY LAYOUT
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mentor Approval Status</span>
                        <span className={`text-xs font-black uppercase ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</span>
                      </div>
                      <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center">
                         <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Final Status</span>
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                            ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            selectedRequest.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'Approved' : selectedRequest.status}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Mentor Remarks</h4>
                      <p className="text-sm text-slate-300 italic min-h-[40px] leading-relaxed">"{selectedRequest.mentorRemarks || 'No remarks provided'}"</p>
                    </div>

                    <div className="bg-slate-950/30 p-8 rounded-[2rem] border border-slate-800/50 space-y-6">
                       <div className="flex justify-between items-center mb-2">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Request Timeline</h4>
                          <div className="text-right">
                             <p className="text-[8px] text-slate-600 font-bold uppercase mb-0.5">Submitted On</p>
                             <p className="text-[10px] text-slate-400 font-bold">{new Date(selectedRequest.submittedDate).toLocaleString()}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-8 py-4 border-t border-slate-800/50">
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">From</p>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">{selectedRequest.fromDate} {selectedRequest.fromTime}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">To</p>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">{selectedRequest.toDate} {selectedRequest.toTime}</p>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-slate-800/50 space-y-4">
                          <div>
                            <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Title</p>
                            <p className="text-sm font-bold text-white uppercase">{selectedRequest.title}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Description</p>
                            <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedRequest.description}"</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : selectedRequest.requestType === 'Other' ? (
                  // Specialized "Other" Layout
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mentor Approval Status</span>
                        <span className={`text-xs font-black uppercase ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</span>
                      </div>
                      <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 flex flex-col items-center justify-center">
                         <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Final Status</span>
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                           ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                           selectedRequest.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                           'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                         }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'Approved' : selectedRequest.status}</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Mentor Remarks</h4>
                      <p className="text-sm text-slate-300 italic">"{selectedRequest.mentorRemarks || 'No remarks provided'}"</p>
                    </div>

                    <div className="bg-slate-950/30 p-6 rounded-[2rem] border border-slate-800/50">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Request Details</h4>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Submitted On</p>
                          <p className="text-[11px] text-slate-300 font-bold">{new Date(selectedRequest.submittedDate).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-6 pt-4 border-t border-slate-800/50">
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1.5">Title</p>
                          <p className="text-base font-bold text-white uppercase tracking-tight">{selectedRequest.title}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1.5">Description / Reason</p>
                          <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedRequest.description}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Default View for non-event requests
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div>
                          <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-5">
                            <UserIcon size={14} className="text-primary-500" />
                            Requester Information
                          </h4>
                          <div className="space-y-5 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
                            <div>
                                <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Name</p>
                                <p className="text-sm font-bold text-white">{selectedRequest.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">ID</p>
                                 <p className="text-xs font-mono text-primary-400">{selectedRequest.requesterId}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Role</p>
                                 <p className="text-xs font-bold text-slate-300 uppercase">{selectedRequest.requesterRole}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                           <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-5">
                             <Clock size={14} className="text-primary-500" />
                             Temporal & Status
                           </h4>
                           <div className="space-y-5 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
                              {selectedRequest.fromDate && (
                                 <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/50">
                                   <div>
                                     <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">From</p>
                                     <p className="text-xs font-bold text-white">{selectedRequest.fromDate}</p>
                                   </div>
                                   <div>
                                     <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">To</p>
                                     <p className="text-xs font-bold text-white">{selectedRequest.toDate}</p>
                                   </div>
                                 </div>
                              )}
                              <div className="flex justify-between items-center">
                                <div>
                                   <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Final Status</p>
                                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                     ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                     selectedRequest.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                     'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                   }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'Approved' : selectedRequest.status}</span>
                                </div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/30 p-8 rounded-[2rem] border border-slate-800/50">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Reason / Description</h4>
                       <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedRequest.description}"</p>
                    </div>

                    {/* Workflow Status */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-inner">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Workflow Approvals</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {selectedRequest.mentorId && (
                            <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Mentor</p>
                              <p className={`text-xs font-bold ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</p>
                              {selectedRequest.mentorRemarks && <p className="text-[10px] text-slate-600 italic mt-2">"{selectedRequest.mentorRemarks}"</p>}
                            </div>
                          )}
                          {selectedRequest.wardenId && (
                            <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Warden</p>
                              <p className={`text-xs font-bold ${selectedRequest.wardenStatus === 'Approved' ? 'text-green-500' : selectedRequest.wardenStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.wardenStatus}</p>
                              {selectedRequest.wardenRemarks && <p className="text-[10px] text-slate-600 italic mt-2">"{selectedRequest.wardenRemarks}"</p>}
                            </div>
                          )}
                          {selectedRequest.hodId && (
                            <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                              <p className="text-[10px] text-slate-500 font-black uppercase mb-2">HOD</p>
                              <p className={`text-xs font-bold ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus}</p>
                              {selectedRequest.hodRemarks && <p className="text-[10px] text-slate-600 italic mt-2">"{selectedRequest.hodRemarks}"</p>}
                            </div>
                          )}
                       </div>
                    </div>

                    {/* Gate Tracking section */}
                    {(selectedRequest.exitTime || selectedRequest.entryTime || (selectedRequest.otp && !selectedRequest.isOtpUsed)) && (
                       <div className="bg-slate-950/30 border border-slate-800/50 rounded-[2rem] p-8 shadow-inner space-y-6">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-3">Security Gate Status</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex justify-between items-center group hover:border-primary-500/30 transition-all">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                     <span className={`h-1.5 w-1.5 rounded-full ${selectedRequest.exitTime ? 'bg-purple-500' : 'bg-slate-700'}`}></span>
                                     Gate Out
                                  </span>
                                  <span className="text-xs font-black text-white uppercase tracking-tighter">
                                    {selectedRequest.exitTime ? new Date(selectedRequest.exitTime).toLocaleString() : '-'}
                                  </span>
                                </div>
                                {selectedRequest.otp && selectedRequest.otpType === 'out' && !selectedRequest.isOtpUsed && (
                                  <div className="bg-primary-500/10 border border-primary-500/20 px-4 py-2 rounded-xl animate-pulse">
                                    <span className="text-[10px] font-black text-primary-400 tracking-[0.2em]">OTP: {selectedRequest.otp}</span>
                                  </div>
                                )}
                             </div>
                             <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex justify-between items-center group hover:border-teal-500/30 transition-all">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                     <span className={`h-1.5 w-1.5 rounded-full ${selectedRequest.entryTime ? 'bg-teal-500' : 'bg-slate-700'}`}></span>
                                     Gate In
                                  </span>
                                  <span className="text-xs font-black text-white uppercase tracking-tighter">
                                    {selectedRequest.entryTime ? new Date(selectedRequest.entryTime).toLocaleString() : '-'}
                                  </span>
                                </div>
                                {selectedRequest.otp && selectedRequest.otpType === 'in' && !selectedRequest.isOtpUsed && (
                                  <div className="bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl animate-pulse">
                                    <span className="text-[10px] font-black text-teal-400 tracking-[0.2em]">OTP: {selectedRequest.otp}</span>
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                  </div>
                )}

                {/* Approver Action Forms */}
                {isApprover && (
                  (selectedRequest.mentorId === user.userId && selectedRequest.mentorStatus === 'Pending') ||
                  (selectedRequest.wardenId === user.userId && selectedRequest.wardenStatus === 'Pending') ||
                  (selectedRequest.hodId === user.userId && selectedRequest.hodStatus === 'Pending')
                ) && (
                  <div className="bg-primary-600/5 border border-primary-500/20 rounded-[2.5rem] p-10 space-y-6">
                    <h4 className="text-lg font-bold flex items-center gap-3">
                      <MessageSquare className="text-primary-500" />
                      Add Your Verdict
                    </h4>
                    <textarea 
                      placeholder="Enter remarks (optional)..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-5 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none min-h-[120px]"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    <div className="flex gap-4">
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleAction(selectedRequest._id, 'approve')}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-green-600/20 disabled:opacity-50"
                      >
                         <Check size={20} /> Approve Request
                      </button>
                      <button 
                         disabled={actionLoading}
                         onClick={() => handleAction(selectedRequest._id, 'reject')}
                         className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50"
                      >
                         <X size={20} /> Reject Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffDashboard;
