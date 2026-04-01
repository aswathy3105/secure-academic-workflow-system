import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { 
  Building,
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock,
  Calendar,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WardenDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Filter for hostel/warden relevant requests
      const response = await api.get('/requests?status=Pending');
      setRequests(response.data);
    } catch (error) {
      toast.error('Error fetching hostel requests');
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
      toast.success('Hostel request approved');
      fetchRequests();
    } catch (error) {
      toast.error('Error approving request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/requests/${id}/reject`);
      toast.success('Hostel request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Error rejecting request');
    }
  };

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="Warden Control Panel" />
      
      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hostel Gate Passes & Requests</h2>
            <p className="text-slate-500 text-sm">Review leave and out-pass requests for residential students.</p>
          </div>
          <Building className="h-10 w-10 text-primary-500/20" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-8 py-4 font-bold">Student ID</th>
                  <th className="px-6 py-4 font-bold">Request Title</th>
                  <th className="px-6 py-4 font-bold text-center">Submitted</th>
                  <th className="px-8 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-8 py-5 h-16 bg-slate-900/10"></td>
                    </tr>
                  ))
                ) : (
                  requests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-5 font-mono font-bold text-white">#{r.userId}</td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-200">{r.title}</p>
                      </td>
                      <td className="px-6 py-5 text-center text-xs text-slate-400">
                        {new Date(r.submittedDate).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedRequest(r)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleApprove(r._id)} className="p-2 bg-green-950/20 border border-green-900/20 rounded-lg text-green-500 hover:bg-green-500 hover:text-white transition-all">
                          <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => handleReject(r._id)} className="p-2 bg-red-950/20 border border-red-900/20 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <XCircle size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6">Request Detail</h3>
              <div className="space-y-4 mb-8">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-bold">Purpose</p>
                  <p className="text-white font-medium">{selectedRequest.title}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-bold">Details</p>
                  <p className="text-white text-sm">{selectedRequest.description}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setSelectedRequest(null)} className="px-6 py-2 bg-slate-800 rounded-xl">Close</button>
                <button onClick={() => { handleApprove(selectedRequest._id); setSelectedRequest(null); }} className="px-6 py-2 bg-green-600 rounded-xl font-bold">Approve</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WardenDashboard;
