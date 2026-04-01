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
  Check,
  MessageSquare,
  Shield,
  Home,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AllRequest = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // For Mentors/Wardens/HODs, show all assigned requests. For regular staff, show their history.
  const isApprover = user?.staffType === 'Mentor' || user?.staffType === 'Warden' || user?.role === 'hod';

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const route = isApprover ? '/requests/assigned' : '/requests/my';
        const res = await api.get(route);
        setRequests(res.data);
      } catch (error) {
        toast.error('Error fetching requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
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
      // Refresh data logic
      const res = await api.get(isApprover ? '/requests/assigned' : '/requests/my');
      setRequests(res.data);
    } catch (error) {
      toast.error('Failed to update request');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (req.requesterId && req.requesterId.toLowerCase().includes(searchLower)) ||
                          (req.requestType && req.requestType.toLowerCase().includes(searchLower)) ||
                          (req.title && req.title.toLowerCase().includes(searchLower)) ||
                          req._id.toLowerCase().includes(searchLower);
    
    const isApprovedSubset = ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status);
    const matchesFilter = filterStatus === 'All' || 
                          (filterStatus === 'Approved' ? isApprovedSubset : req.status === filterStatus);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="My Requests" />
      
      <main className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold">My Requests</h2>
            <p className="text-slate-500 text-sm mt-1">Search, filter, and manage academic workflow requests.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative group flex-grow sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search (ID or Type)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative group sm:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={18} />
              <select 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition-all appearance-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-6 py-5 font-bold">Staff ID</th>
                  <th className="px-6 py-5 font-bold">Type</th>
                  <th className="px-6 py-5 font-bold">Title</th>
                  <th className="px-6 py-5 font-bold">Submitted Date</th>
                  <th className="px-6 py-5 font-bold text-center">Status</th>
                  <th className="px-6 py-5 font-bold text-right text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-5 h-20"></td></tr>)
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition-all group font-medium">
                      <td className="px-6 py-5 font-mono text-xs text-slate-500 uppercase">{req.requesterId || user?.userId || '(Loading...)'}</td>
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
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          ['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status) ? 'bg-green-500/10 text-green-500' :
                          req.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status) ? 'Approved' : req.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}
                          className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all shadow-lg active:scale-90"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                       No requests found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* View/Action Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] p-10 relative z-10 shadow-3xl max-h-[90vh] overflow-y-auto custom-scrollbar" >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black">{selectedRequest?.title || 'No Title'}</h2>
                  <p className="text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                    {selectedRequest?.requestType} • ID #{selectedRequest?._id?.slice(-6).toUpperCase() || 'N/A'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div>
                        <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-5">
                          <UserIcon size={14} className="text-primary-500" /> Requester Info
                        </h4>
                        <div className="space-y-5 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
                           <div>
                              <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Name</p>
                              <p className="text-sm font-bold text-white">{selectedRequest.name}</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">ID</p>
                                <p className="text-xs font-mono text-primary-400">{selectedRequest.staffId || selectedRequest.requesterId}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Role</p>
                                <p className="text-xs font-bold text-slate-300 uppercase">{selectedRequest.role || selectedRequest.requesterRole}</p>
                             </div>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                     <div>
                       <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-5">
                         <Clock size={14} className="text-primary-500" /> Workflow timeline
                       </h4>
                       <div className="space-y-5 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
                          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/50">
                            <div>
                              <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">From</p>
                              <p className="text-xs font-bold text-white">{selectedRequest.fromDate || 'N/A'}</p>
                              <p className="text-[10px] text-slate-500">{selectedRequest.fromTime || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">To</p>
                              <p className="text-xs font-bold text-white">{selectedRequest.toDate || 'N/A'}</p>
                              <p className="text-[10px] text-slate-500">{selectedRequest.toTime || 'N/A'}</p>
                            </div>
                          </div>
                          
                          {selectedRequest.proofFile && (
                            <div className="pt-4 border-t border-slate-800/50 space-y-4">
                              <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} />
                                Proof Document
                              </h4>
                              <div className="flex gap-4">
                                <a
                                  href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 bg-slate-900 border border-slate-800 text-white text-[10px] font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                  View PDF
                                </a>
                                <a
                                  href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                                  download
                                  className="flex-1 bg-primary-600 text-white text-[10px] font-bold py-2.5 rounded-xl hover:bg-primary-500 shadow-lg shadow-primary-600/10 transition-all flex items-center justify-center gap-2"
                                >
                                  Download PDF
                                </a>
                              </div>
                            </div>
                          )}
                          {selectedRequest.requestType === 'On Duty' && !selectedRequest.proofFile && (
                            <div className="pt-4 border-t border-slate-800/50 text-center">
                              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                No file uploaded
                              </p>
                            </div>
                          )}
                          <div>
                               <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Submission Date</p>
                               <p className="text-xs font-bold text-white">{new Date(selectedRequest.submittedDate).toLocaleString()}</p>
                          </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="bg-slate-950/30 p-8 rounded-[2rem] border border-slate-800/50">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Description of reason</h4>
                    <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedRequest.description}"</p>
                 </div>

                 {/* Role-Based Additions for Warden */}
                 {(selectedRequest.role?.toLowerCase() === 'warden' || selectedRequest.requesterStaffType === 'Warden') && (
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                       <h4 className="text-[11px] font-black text-primary-500 uppercase tracking-[0.2em]">Gate Details</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Otp for out and in</span>
                             <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[100px]">
                                {selectedRequest.isOtpUsed ? (
                                   <span className="text-slate-400 font-bold">OTP: Used</span>
                                ) : selectedRequest.otp ? (
                                   <span className="text-2xl font-black text-white tracking-widest">{selectedRequest.otp}</span>
                                ) : (
                                   <span className="text-slate-600 font-black text-xl tracking-widest">N/A</span>
                                )}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="flex flex-col gap-4">
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase">Gate out: date and time</span>
                                   <span className="text-xs font-bold">{selectedRequest.exitTime ? new Date(selectedRequest.exitTime).toLocaleString() : 'Not recorded'}</span>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase">Gate in: date and time</span>
                                   <span className="text-xs font-bold">{selectedRequest.entryTime ? new Date(selectedRequest.entryTime).toLocaleString() : 'Not recorded'}</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Workflow Status */}
                 <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Approval Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                         <p className="text-[10px] text-slate-500 font-black uppercase mb-2">HOD Status</p>
                         <p className={`text-xs font-bold ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus}</p>
                         {selectedRequest.hodRemarks && <p className="text-[10px] text-slate-600 italic mt-2">Hod Remarks: "{selectedRequest.hodRemarks}"</p>}
                       </div>
                       <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50 flex flex-col justify-center">
                          <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Final Status</p>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase text-center ${
                             ['Approved', 'Forwarded to Gate', 'Out', 'Inside', 'Completed'].includes(selectedRequest.status) ? 'bg-green-500/20 text-green-500' :
                             selectedRequest.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                             'bg-yellow-500/20 text-yellow-500'
                          }`}>{['Approved', 'Forwarded to Gate', 'Out', 'Inside', 'Completed'].includes(selectedRequest.status) ? 'Approved' : selectedRequest.status}</span>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllRequest;
