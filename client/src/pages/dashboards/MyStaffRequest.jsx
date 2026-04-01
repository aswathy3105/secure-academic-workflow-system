import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  X,
  User as UserIcon,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Download,
  Layout,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const MyStaffRequest = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleViewRequest = async (requestId) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setSelectedRequest({ _id: requestId }); // Set temp ID for modal open
    try {
      const response = await api.get(`/requests/${requestId}`);
      setSelectedRequest(response.data);
    } catch (error) {
      console.error('Error fetching request details');
      setIsModalOpen(false);
      setSelectedRequest(null);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, statsRes] = await Promise.all([
          api.get('/requests/my'),
          api.get('/requests/staff/stats')
        ]);
        setRequests(reqRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Sync modal with polled updates
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find(r => r._id === selectedRequest._id);
      if (updated) setSelectedRequest(updated);
    }
  }, [requests, selectedRequest?._id]);

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const shortId = req._id.slice(-6).toLowerCase();
    const isSearchMatch = req.title.toLowerCase().includes(searchLower) || 
                          req.requestType.toLowerCase().includes(searchLower) ||
                          shortId.includes(searchLower);

    const isApprovedState = (status) => ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(status);
    
    const isFilterMatch = filterStatus === 'All' || 
                          (filterStatus === 'Approved' ? isApprovedState(req.status) : req.status === filterStatus);

    return isSearchMatch && isFilterMatch;
  });

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="My Request" />

      <main className="p-8 space-y-10 max-w-7xl mx-auto pb-20">
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Requests', value: stats.total, icon: Calendar, color: 'text-primary-500', bg: 'bg-primary-500/10' },
            { label: 'Pending Requests', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Approved Requests', value: stats.approved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Rejected Requests', value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl hover:border-slate-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{card.label}</p>
              <h3 className="text-3xl font-black mt-1 group-hover:scale-105 transition-transform origin-left">{card.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
            <input
              type="text"
              placeholder="Search (ID or Type)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={16} className="text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-6 py-4 font-bold">Staff ID</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-5 h-20"></td>
                    </tr>
                  ))
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition-all group font-medium">
                      <td className="px-6 py-5 text-slate-500 font-mono text-xs uppercase">{req.staffId || req.requesterId || user?.userId || '(Loading...)'}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-300">
                          {req.requestType}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-white">{req.title}</td>
                      <td className="px-6 py-5 text-slate-400">
                        <div className="flex flex-col">
                          <span>{new Date(req.submittedDate).toLocaleDateString()}</span>
                          <span className="text-[10px] opacity-60">
                            {new Date(req.submittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          ['Approved', 'Forwarded to Gate', 'Out', 'Inside', 'Completed'].includes(req.status) ? 'bg-green-500/10 text-green-500' :
                          req.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {['Approved', 'Forwarded to Gate', 'Out', 'Inside', 'Completed'].includes(req.status) ? 'Approved' : req.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleViewRequest(req._id)}
                          className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-lg shadow-black/20"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                      No matching requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
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
                      <h2 className="text-3xl font-black tracking-tight">{selectedRequest.title || 'Request Details'}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          selectedRequest.requestType === 'Leave' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' :
                          selectedRequest.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-primary-500/10 text-primary-500 border-primary-500/20'
                        }`}>
                          {selectedRequest.requestType}
                        </span>
                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg font-mono">
                          ID: #{selectedRequest._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-8 text-left">
                    {/* SECTION 1: BASIC DETAILS */}
                    <div className="bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50 shadow-inner">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Description</h4>
                       <p className="text-sm text-slate-300 italic leading-relaxed">"{selectedRequest.description}"</p>
                    </div>

                    {/* SECTION 2 & 3: GRID LAYOUT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Staff Information */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase font-mono">
                          <UserIcon size={14} className="text-primary-500" /> Staff Information
                        </h4>
                        <div className="bg-slate-950/20 p-6 rounded-3xl border border-slate-800/30 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Name</p>
                              <p className="text-sm text-white font-bold">{selectedRequest.name}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Staff ID</p>
                              <p className="text-sm text-white font-mono">{selectedRequest.staffId || selectedRequest.requesterId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Department</p>
                              <p className="text-xs text-slate-300 font-medium">{selectedRequest.department || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Email ID</p>
                              <p className="text-[10px] text-slate-300 font-medium break-all">{selectedRequest.email || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/30">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">HOD Name</p>
                              <p className="text-xs text-white font-bold">{selectedRequest.hodName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Submitted On</p>
                              <p className="text-xs text-slate-400 font-bold italic">{new Date(selectedRequest.submittedDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date & Time (Conditional) */}
                      {['Leave', 'On Duty'].includes(selectedRequest.requestType) ? (
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
                      ) : (
                        <div className="flex items-center justify-center bg-slate-950/10 border-2 border-dashed border-slate-800/50 rounded-3xl p-6 h-[calc(100%-2rem)] mt-6">
                           <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center italic leading-relaxed">Specific time range not applicable<br/>for this request type</p>
                        </div>
                      )}
                    </div>

                    {/* STATUS & REMARKS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800/50">
                       {/* STATUS CARD */}
                       <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">
                             <Layout size={14} className="text-primary-500" /> Workflow Status
                          </h4>
                          <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HOD Status</span>
                                <span className={`text-[10px] font-black uppercase ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus || 'Pending'}</span>
                             </div>

                             {/* Warden-specific "Going Out" field */}
                             {(user?.role?.toLowerCase() === 'warden' || selectedRequest.requesterStaffType === 'Warden') && (
                               <div className="flex justify-between items-center pt-3 border-t border-slate-800/30">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Going Out</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${selectedRequest.goingOut === 'Yes' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                    {selectedRequest.goingOut || 'No'}
                                  </span>
                               </div>
                             )}

                             <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/20 flex justify-between items-center mt-2">
                                <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest font-mono">Final Status</span>
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border ${
                                  ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'bg-green-500/20 text-green-500 border-green-500/20' :
                                  selectedRequest.status === 'Rejected' ? 'bg-red-500/20 text-red-500 border-red-500/20' :
                                  'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                                }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ? 'Approved' : selectedRequest.status}</span>
                             </div>
                          </div>
                       </div>

                       {/* REMARKS CARD */}
                       <div className="space-y-4">
                          <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">
                            <MessageSquare size={14} className="text-primary-500" /> HOD Remarks
                          </h4>
                          <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800/50 h-[calc(100%-2rem)] flex flex-col justify-center">
                             <p className="text-sm text-slate-300 italic leading-relaxed font-serif">
                               "{selectedRequest.hodRemarks || 'No remarks provided by HOD'}"
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* GATE TRACKING (WARDEN ONLY + GOING OUT YES + APPROVED) */}
                    {( (user?.role?.toLowerCase() === 'warden' || selectedRequest.requesterStaffType === 'Warden') && 
                       selectedRequest.goingOut === 'Yes' && 
                       ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(selectedRequest.status) ) && (
                      <div className="bg-slate-950/50 border border-slate-800/50 rounded-[2.5rem] p-8 space-y-6 shadow-inner mt-8">
                         <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">🚪 Gate Tracking</h4>
                            <span className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em]">Security Active</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-slate-950/50 p-5 rounded-3xl border border-slate-800/30 group">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block font-mono">Gate Out</span>
                               <span className="text-xs font-black text-purple-400 uppercase tracking-tighter">
                                 {selectedRequest.exitTime ? new Date(selectedRequest.exitTime).toLocaleString() : 'Not recorded'}
                               </span>
                            </div>
                            <div className="text-center bg-slate-950/50 p-5 rounded-3xl border border-slate-800/30 group">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block font-mono">Gate In</span>
                               <span className="text-xs font-black text-teal-400 uppercase tracking-tighter">
                                 {selectedRequest.entryTime ? new Date(selectedRequest.entryTime).toLocaleString() : 'Not recorded'}
                               </span>
                            </div>
                            <div className={`bg-primary-500/10 p-5 rounded-3xl border flex flex-col items-center justify-center ${selectedRequest.otp && !selectedRequest.isOtpUsed ? 'border-primary-500/20 shadow-lg shadow-primary-500/10' : 'border-slate-800/40 opacity-50'}`}>
                               <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1 font-mono">OTP</span>
                               <span className="text-2xl font-black text-white tracking-[0.2em]">
                                 {selectedRequest.isOtpUsed ? 'N/A' : (selectedRequest.otp || 'N/A')}
                               </span>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* PROOF FILE (EXISTS) */}
                    {selectedRequest.proofFile && (
                      <div className="pt-4 mt-8 pt-8 border-t border-slate-800/50">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 font-mono">Supporting Reference</h4>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-primary-500/30 transition-all shadow-xl">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                                 <FileText size={24} />
                              </div>
                              <div className="text-left">
                                 <p className="text-sm font-bold text-white">Reference Document.pdf</p>
                                 <p className="text-[10px] text-slate-500 uppercase tracking-[0.1em] font-mono">ENCRYPTED CLOUD STORAGE</p>
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
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-slate-800 flex justify-end">
                    <button onClick={() => setIsModalOpen(false)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 text-[10px] font-black uppercase tracking-widest font-mono">
                      Close Detail
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

export default MyStaffRequest;
