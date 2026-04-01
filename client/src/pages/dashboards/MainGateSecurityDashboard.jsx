import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import { Search, KeyRound, ShieldCheck, Eye, XCircle, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const statusBadge = (status) => {
  const styles = {
    'Forwarded to Gate': 'bg-blue-500/10 text-blue-400',
    'Out': 'bg-purple-500/10 text-purple-400',
    'Inside': 'bg-teal-500/10 text-teal-400',
    'Approved': 'bg-green-500/10 text-green-400',
  };
  return `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-slate-500/10 text-slate-400'}`;
};

const MainGateSecurityDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(null);
  const countdownRef = useRef(null);

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

  useEffect(() => { 
    fetchRequests(); 
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const startCountdown = (expiryDate) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.round((new Date(expiryDate) - Date.now()) / 1000));
      setOtpCountdown(remaining);
      if (remaining <= 0) clearInterval(countdownRef.current);
    };
    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
  };

  const handleGenerateOTP = async (otpType) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/requests/${selectedRequest._id}/otp/generate`, { otpType });
      toast.success(`OTP generated for ${otpType === 'out' ? 'EXIT' : 'ENTRY'}!`);
      setSelectedRequest(res.data);
      startCountdown(res.data.otpExpiry);
      // Refresh list
      const listRes = await api.get('/requests/assigned');
      setRequests(listRes.data);
    } catch {
      toast.error('Failed to generate OTP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput.trim()) return toast.error('Please enter OTP');
    setActionLoading(true);
    try {
      const res = await api.post(`/requests/${selectedRequest._id}/otp/verify`, { otp: otpInput });
      toast.success(res.data.message || 'OTP verified!');
      // Access the updated request from the response
      const updatedRequest = res.data.request || res.data;
      setSelectedRequest(updatedRequest);
      setOtpInput('');
      if (countdownRef.current) clearInterval(countdownRef.current);
      setOtpCountdown(null);
      const listRes = await api.get('/requests/assigned');
      setRequests(listRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or Expired OTP. Please try again');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter(req => {
    const s = searchTerm.toLowerCase();
    return (req.requesterId && req.requesterId.toLowerCase().includes(s)) ||
           (req.requestType && req.requestType.toLowerCase().includes(s)) ||
           (req.requesterRole && req.requesterRole.toLowerCase().includes(s)) ||
           (req.name && req.name.toLowerCase().includes(s));
  });

  const getOtpStatus = (req) => {
    if (!req.otp) return null;
    if (req.isOtpUsed) return { label: 'Used', color: 'text-slate-500' };
    if (new Date() > new Date(req.otpExpiry)) return { label: 'Expired', color: 'text-red-500' };
    return { label: 'Active', color: 'text-green-500 animate-pulse' };
  };

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="🚪 Main Gate Security" />

      <main className="p-8 space-y-6 max-w-7xl mx-auto pb-20">
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
            <input
              type="text"
              placeholder="Search (ID or Role)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-bold text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Main Gate — Active
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
                      <td colSpan={5} className="px-6 py-5 h-16"></td>
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
                        <button
                          onClick={() => { setSelectedRequest(req); setOtpInput(''); setOtpCountdown(null); setIsModalOpen(true); }}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600/20 border border-primary-500/30 hover:bg-primary-600 text-primary-400 hover:text-white rounded-lg text-xs font-bold transition-all ml-auto"
                        >
                          <Eye size={14} /> Manage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                      No forwarded requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* OTP Action Modal */}
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
                    {selectedRequest.requestType} · {selectedRequest.requesterRole?.toUpperCase() || 'STUDENT'} · {selectedRequest.requesterId?.toUpperCase()}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">ID</p>
                  <p className="text-white font-mono">{selectedRequest.requesterId}</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Role</p>
                  <p className="text-white font-bold capitalize">{selectedRequest.requesterRole || 'Student'}</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current Status</p>
                  <span className={statusBadge(selectedRequest.status)}>{selectedRequest.status}</span>
                </div>
                {selectedRequest.exitTime && (
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Exit Time</p>
                    <p className="text-purple-400 font-bold text-xs">{new Date(selectedRequest.exitTime).toLocaleString()}</p>
                  </div>
                )}
                {selectedRequest.entryTime && (
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Entry Time</p>
                    <p className="text-teal-400 font-bold text-xs">{new Date(selectedRequest.entryTime).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Approval History */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-6 space-y-4 mb-6 shadow-inner">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-3">Staff Approval History</h4>
                <div className="grid grid-cols-2 gap-6">
                  {selectedRequest.mentorId && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 leading-none">Mentor Approval</p>
                      <p className={`text-xs font-bold ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</p>
                      {selectedRequest.mentorRemarks && <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">"{selectedRequest.mentorRemarks}"</p>}
                    </div>
                  )}
                  {selectedRequest.wardenId && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 leading-none">Warden Approval</p>
                      <p className={`text-xs font-bold ${selectedRequest.wardenStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>{selectedRequest.wardenStatus}</p>
                      {selectedRequest.wardenRemarks && <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">"{selectedRequest.wardenRemarks}"</p>}
                    </div>
                  )}
                  {selectedRequest.hodId && (
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                      <p className="text-[9px] text-slate-600 font-bold uppercase mb-1 leading-none">HOD Approval</p>
                      <p className={`text-xs font-bold ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus}</p>
                      {selectedRequest.hodRemarks && <p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">"{selectedRequest.hodRemarks}"</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* OTP Section */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <KeyRound size={14} className="text-primary-500" /> OTP Control Panel
                </h4>

                {/* Current OTP Display */}
                {selectedRequest.otp && !selectedRequest.isOtpUsed && new Date() < new Date(selectedRequest.otpExpiry) && (
                  <div className="bg-primary-600/10 border border-primary-500/30 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                      Active OTP ({selectedRequest.otpType?.toUpperCase()} — {otpCountdown !== null ? `${otpCountdown}s remaining` : 'Check expiry'})
                    </p>
                    <p className="text-3xl font-black tracking-[0.5em] text-primary-400">{selectedRequest.otp}</p>
                    {otpCountdown !== null && otpCountdown <= 15 && (
                      <p className="text-red-400 text-[10px] font-bold mt-1 animate-pulse">⚠ Expiring soon!</p>
                    )}
                  </div>
                )}

                {/* Generate OTP Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={actionLoading || selectedRequest.status === 'Out' || selectedRequest.status === 'Inside'}
                    onClick={() => handleGenerateOTP('out')}
                    className="flex items-center justify-center gap-2 py-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 text-purple-400 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  >
                    <LogOut size={14} /> Generate OTP (OUT)
                  </button>
                  <button
                    disabled={actionLoading || selectedRequest.status !== 'Out'}
                    onClick={() => handleGenerateOTP('in')}
                    className="flex items-center justify-center gap-2 py-3 bg-teal-600/20 border border-teal-500/30 hover:bg-teal-600 text-teal-400 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                  >
                    <LogIn size={14} /> Generate OTP (IN)
                  </button>
                </div>

                {/* Verify OTP */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter OTP to Verify</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    <button
                      disabled={actionLoading || !otpInput.trim()}
                      onClick={handleVerifyOTP}
                      className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      <ShieldCheck size={14} /> Verify
                    </button>
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

export default MainGateSecurityDashboard;
