import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import { Search, ShieldCheck, ArrowRightCircle, Eye, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const styles = {
    'Approved': 'bg-green-500/10 text-green-500',
    'Pending': 'bg-yellow-500/10 text-yellow-500',
    'Rejected': 'bg-red-500/10 text-red-500',
    'Forwarded to Gate': 'bg-blue-500/10 text-blue-400',
    'Out': 'bg-purple-500/10 text-purple-400',
    'Inside': 'bg-teal-500/10 text-teal-400',
  };
  return `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-slate-500/10 text-slate-400'}`;
};

const HostelSecurityDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forwarding, setForwarding] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/assigned');
      setRequests(res.data);
    } catch {
      toast.error('Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleForward = async (id) => {
    setForwarding(id);
    try {
      await api.post(`/requests/${id}/forward-to-gate`);
      toast.success('Request forwarded to Main Gate!');
      fetchRequests();
    } catch {
      toast.error('Failed to forward request');
    } finally {
      setForwarding(null);
    }
  };

  const filtered = requests.filter(req => {
    const s = searchTerm.toLowerCase();
    return (req.requesterId && req.requesterId.toLowerCase().includes(s)) ||
           (req.requestType && req.requestType.toLowerCase().includes(s)) ||
           (req.title && req.title.toLowerCase().includes(s));
  });

  const hostelLabel = user?.securityType === 'Girls Hostel' ? '🏨 Girls Hostel Security' : '🏨 Boys Hostel Security';

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title={hostelLabel} />

      <main className="p-8 space-y-6 max-w-7xl mx-auto pb-20">
        {/* Search */}
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
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-xs font-bold text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            {user?.securityType} — Active
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">ID</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Type</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Role</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500">Date</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-5 h-16"></td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition-all group font-medium">
                      <td className="px-6 py-5 font-mono text-xs text-white font-bold tracking-tighter">#{req.requesterId}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                          req.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          req.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-800'
                        }`}>
                          {req.requestType}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-300 text-[10px] font-bold uppercase tracking-wide">
                        {req.requesterRole === 'student' ? 'Student' : `Staff (${req.requesterStaffType || 'Regular'})`}
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs font-bold">
                        {new Date(req.submittedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={statusBadge(req.status)}>{req.status}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedRequest(req); setIsModalOpen(true); }}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                          >
                            <Eye size={15} />
                          </button>
                          {req.status === 'Approved' && (
                            <button
                              onClick={() => handleForward(req._id)}
                              disabled={forwarding === req._id}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <ArrowRightCircle size={14} />
                              {forwarding === req._id ? 'Forwarding...' : 'Forward to Gate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 italic">
                      No approved requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold italic uppercase">{selectedRequest.name}</h2>
                  <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mt-1">
                    {selectedRequest.requestType} · {selectedRequest.requesterRole || 'Student'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
                  <XCircle size={22} />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">ID</p>
                    <p className="text-white font-mono">{selectedRequest.requesterId}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Name</p>
                    <p className="text-white">{selectedRequest.name}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                    <span className={statusBadge(selectedRequest.status)}>{selectedRequest.status}</span>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Submitted</p>
                    <p className="text-white">{new Date(selectedRequest.submittedDate).toLocaleString()}</p>
                  </div>
                </div>
                {selectedRequest.description && (
                  <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Description</p>
                    <p className="text-slate-300 italic">"{selectedRequest.description}"</p>
                  </div>
                )}
                
                {/* Approval History */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-inner">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Approval History</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.mentorId && (
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Mentor</p>
                        <p className={`text-[10px] font-bold ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</p>
                        {selectedRequest.mentorRemarks && <p className="text-[9px] text-slate-500 italic mt-1 leading-tight">"{selectedRequest.mentorRemarks}"</p>}
                      </div>
                    )}
                    {selectedRequest.wardenId && (
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Warden</p>
                        <p className={`text-[10px] font-bold ${selectedRequest.wardenStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>{selectedRequest.wardenStatus}</p>
                        {selectedRequest.wardenRemarks && <p className="text-[9px] text-slate-500 italic mt-1 leading-tight">"{selectedRequest.wardenRemarks}"</p>}
                      </div>
                    )}
                  </div>
                </div>
                {selectedRequest.status === 'Approved' && (
                  <button
                    onClick={() => { handleForward(selectedRequest._id); setIsModalOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                  >
                    <ArrowRightCircle size={16} /> Forward to Main Gate
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostelSecurityDashboard;
