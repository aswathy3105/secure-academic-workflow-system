import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock,
  Calendar,
  FileText,
  ExternalLink,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MentorDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/requests/assigned');
      // Filter for requests where this mentor needs to take action (Pending)
      const pendingRequests = response.data.filter(r => r.status === 'Pending' || r.mentorStatus === 'Pending');
      setRequests(pendingRequests);
    } catch (error) {
      toast.error('Error fetching student requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/requests/${id}/approve`);
      toast.success('Request approved');
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

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="Mentor Approval Portal" />
      
      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Requests</h2>
            <p className="text-slate-500 text-sm">Review and approve academic or leave requests from your assigned students.</p>
          </div>
          <button onClick={fetchRequests} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-all">
            Refresh
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-8 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold text-center">Type</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold text-center uppercase tracking-[0.2em]">Date</th>
                  <th className="px-6 py-4 font-bold text-center uppercase tracking-[0.2em]">proof</th>
                  <th className="px-8 py-4 font-bold text-right uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-8 py-5 h-16 bg-slate-900/10"></td>
                    </tr>
                  ))
                ) : (
                  requests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition-all group border-b border-slate-800/30 last:border-0">
                      <td className="px-8 py-5">
                        <span className="text-sm font-mono font-bold text-white">#{r.requesterId || r.userId}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={r.requestType} />
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {r.requesterRole === 'student' ? 'Student' : 
                           `Staff (${r.requesterStaffType || 'Regular Staff'})`}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{r.title}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-xs font-bold text-white whitespace-nowrap">{new Date(r.submittedDate).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {r.proofFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={`http://localhost:5000/api/requests/proof/${r.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-slate-800 hover:bg-primary-600 text-slate-400 hover:text-white rounded-md transition-all tooltip"
                              title="View Document"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <a
                              href={`http://localhost:5000/api/requests/proof/${r.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                              download
                              className="p-1.5 bg-slate-800 hover:bg-primary-600 text-slate-400 hover:text-white rounded-md transition-all"
                              title="Download PDF"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center block">N/A</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedRequest(r)}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-lg"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleApprove(r._id)}
                            className="p-2 bg-green-950/20 border border-green-900/20 rounded-lg text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-lg"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(r._id)}
                            className="p-2 bg-red-950/20 border border-red-900/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-500 italic">
                      No pending requests to review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal - Same as AllRequests for consistency */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <FileText className="text-primary-500" /> Request Preview
              </h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">Title</h4>
                  <p className="text-white bg-slate-950 p-4 rounded-xl border border-slate-800">{selectedRequest.title}</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">Description</h4>
                  <p className="text-white bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm">{selectedRequest.description}</p>
                </div>

                {selectedRequest.proofFile && (
                  <div className="bg-primary-500/5 p-6 rounded-2xl border border-primary-500/10 space-y-4">
                    <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} />
                      Proof Document
                    </h4>
                    <div className="flex gap-4">
                      <a
                        href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-center"
                      >
                        View PDF
                      </a>
                      <a
                        href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                        download
                        className="flex-1 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 text-center"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>
                )}

                {selectedRequest.requestType === 'On Duty' && !selectedRequest.proofFile && (
                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-center">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-2">
                       No file uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setSelectedRequest(null)} className="px-6 py-2 bg-slate-800 rounded-xl">Close</button>
                <button onClick={() => { handleReject(selectedRequest._id); setSelectedRequest(null); }} className="px-6 py-2 bg-red-600 rounded-xl font-bold">Reject</button>
                <button onClick={() => { handleApprove(selectedRequest._id); setSelectedRequest(null); }} className="px-6 py-2 bg-green-600 rounded-xl font-bold">Approve</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorDashboard;
