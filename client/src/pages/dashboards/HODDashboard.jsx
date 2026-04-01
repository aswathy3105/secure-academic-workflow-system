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
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import RequestTable from '../../components/RequestTable';

const HODDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reqRes] = await Promise.all([
        api.get('/requests/hod/stats'),
        api.get('/requests/hod')
      ]);
      setStats(statsRes.data);
      setRequests(reqRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, type) => {
    setActionLoading(true);
    try {
      if (type === 'approve') {
        await api.put(`/requests/${requestId}/approve`, { remarks });
        toast.success('Request Approved');
      } else {
        if (!confirm('Are you sure you want to reject this request?')) {
          setActionLoading(false);
          return;
        }
        await api.put(`/requests/${requestId}/reject`, { remarks });
        toast.error('Request Rejected');
      }
      setIsModalOpen(false);
      setRemarks('');
      setRequests(prev => prev.filter(r => r._id !== requestId));
      // Refresh stats in background
      const statsRes = await api.get('/requests/hod/stats');
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to process request');
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50 pb-12">
      <Header title="HOD Dashboard" />
      
      <main className="p-8 space-y-12 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-10 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] -mr-12 -mt-12" />
          <h2 className="text-4xl font-black tracking-tightest text-white">
            Welcome, Head of Department
          </h2>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-[0.3em] text-[10px]">
            Academic Portal • {user?.name}
          </p>
        </div>

        {/* Request List */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-4">
             <div>
               <h3 className="text-xl font-black italic tracking-tighter uppercase">Assigned Requests</h3>
               <p className="text-xs text-slate-500 mt-1 font-bold tracking-widest uppercase">Requests awaiting your final verdict</p>
             </div>
             <span className="text-[10px] font-black uppercase bg-slate-900 border border-slate-800 px-4 py-2 rounded-full text-slate-400">
               {requests.length} Pending Actions
             </span>
          </div>
          
          <RequestTable 
            requests={requests} 
            loading={loading}
            onView={(req) => { setSelectedRequest(req); setIsModalOpen(true); }}
            onApprove={(req) => handleAction(req._id, 'approve')}
            onReject={(req) => handleAction(req._id, 'reject')}
          />
        </section>
      </main>

      {/* Details & Action Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedRequest?.title}
      >
        {selectedRequest && (
          <div className="space-y-12">
            {selectedRequest.requestType === 'Event' ? (
              // Specialized Event Layout (Full Width)
              <div className="space-y-8">
                {/* Approval Status Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mentor Approval</span>
                    <span className={`text-xs font-black uppercase ${
                      selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' :
                      selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'
                    }`}>{selectedRequest.mentorStatus}</span>
                  </div>
                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">HOD Approval</span>
                    <span className={`text-xs font-black uppercase ${
                      selectedRequest.hodStatus === 'Approved' ? 'text-green-500' :
                      selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'
                    }`}>{selectedRequest.hodStatus}</span>
                  </div>
                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">Final Status</span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                      ['Approved'].includes(selectedRequest.status) ? 'bg-green-500/20 text-green-500 border-green-500/20' :
                      ['Rejected'].includes(selectedRequest.status) ? 'bg-red-500/20 text-red-500 border-red-500/20' :
                      'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                    }`}>{selectedRequest.status}</span>
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
                      {selectedRequest.mentorRemarks ? `"${selectedRequest.mentorRemarks}"` : "None given"}
                    </p>
                  </div>
                  <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">HOD Remarks</h4>
                    <p className="text-sm text-slate-300 italic min-h-[40px]">
                      {selectedRequest.hodStatus === 'Pending' ? 'Awaiting your decision...' : (selectedRequest.hodRemarks ? `"${selectedRequest.hodRemarks}"` : "None given")}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-800/50">
                  <div>
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-slate-500 tracking-widest uppercase mb-6">
                      <UserIcon size={14} className="text-primary-500" />
                      Student Info
                    </h4>
                    <div className="space-y-4 text-sm bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50 shadow-inner">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Name</p>
                          <p className="text-white font-medium">{selectedRequest.name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Student ID</p>
                          <p className="text-white font-medium tracking-wide">{selectedRequest.requesterId}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Department</p>
                          <p className="text-white font-medium line-clamp-2">{selectedRequest.department || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Email</p>
                          <p className="text-white font-medium text-xs break-all">{selectedRequest.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/30">
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Mentor</p>
                          <p className="text-white font-bold text-[10px] uppercase">{selectedRequest.mentorName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Warden</p>
                          <p className="text-white font-bold text-[10px] uppercase">{selectedRequest.wardenName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">HOD</p>
                          <p className="text-white font-bold text-[10px] uppercase">{selectedRequest.hodName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="flex items-center gap-2 text-[11px] font-black text-slate-500 tracking-widest uppercase">
                      <Calendar size={14} className="text-primary-500" />
                      Event Timing
                    </h4>
                    <div className="space-y-6 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50 flex flex-col justify-center shadow-inner">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">From</p>
                          <p className="text-lg font-black text-white">{selectedRequest.fromDate}</p>
                          <p className="text-sm font-bold text-slate-400">{selectedRequest.fromTime}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">To</p>
                          <p className="text-lg font-black text-white">{selectedRequest.toDate}</p>
                          <p className="text-sm font-bold text-slate-400">{selectedRequest.toTime}</p>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-800/50">
                        <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Submitted On</p>
                        <p className="text-white font-bold">{new Date(selectedRequest.submittedDate).toLocaleString()}</p>
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
            ) : (
              // Default Layout (2-Column Grid)
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* User Details */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <UserIcon size={14} className="text-primary-500" />
                    Requester Information
                  </h4>
                  <div className="bg-slate-950/50 p-8 rounded-[2.5rem] border border-slate-800/50 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary-600 flex items-center justify-center font-black text-xl">
                        {selectedRequest.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-lg font-black text-white">{selectedRequest.name}</p>
                        <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">{selectedRequest.requesterRole}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                      <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase mb-1">ID</p>
                        <p className="text-slate-300 font-mono text-xs">{selectedRequest.requesterId}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-600 font-black uppercase mb-1">Email</p>
                        <p className="text-slate-300 truncate text-xs">{selectedRequest.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Workflow States</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedRequest.mentorId && (
                      <div className="bg-slate-950/30 p-6 rounded-[2rem] border border-slate-800/50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-600">Mentor</span>
                          <StatusBadge status={selectedRequest.mentorStatus} />
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-2">
                          {selectedRequest.mentorRemarks ? `"${selectedRequest.mentorRemarks}"` : "No remarks"}
                        </p>
                      </div>
                    )}
                    {selectedRequest.wardenId && (
                      <div className="bg-slate-950/30 p-6 rounded-[2rem] border border-slate-800/50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-600">Warden</span>
                          <StatusBadge status={selectedRequest.wardenStatus} />
                        </div>
                        <p className="text-[10px] text-slate-500 italic mt-2">
                          {selectedRequest.wardenRemarks ? `"${selectedRequest.wardenRemarks}"` : "No remarks"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Info */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Calendar size={14} className="text-primary-500" />
                    Request Details
                  </h4>
                  <div className="bg-slate-950/50 p-8 rounded-[2.5rem] border border-slate-800/50 space-y-6">
                    <div className="flex justify-between items-center">
                      <StatusBadge status={selectedRequest.requestType} />
                      <div className="text-right">
                        <p className="text-[9px] text-slate-600 font-black uppercase">Submitted</p>
                        <p className="text-xs text-slate-300 font-bold">{new Date(selectedRequest.submittedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {selectedRequest.fromDate && (
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                        <p className="text-[9px] text-slate-600 font-black uppercase mb-2">Duration</p>
                        <p className="text-xs font-bold text-white tracking-tighter">{selectedRequest.fromDate} — {selectedRequest.toDate}</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-[9px] text-slate-600 font-black uppercase">Reason</p>
                      <p className="text-sm text-slate-300 italic">"{selectedRequest.description}"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRequest.proofFile && (
              <div className="bg-primary-500/5 p-8 rounded-[2.5rem] border border-primary-500/10 space-y-4">
                <h4 className="text-[10px] font-black text-primary-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={16} />
                  Verification Proof Document
                </h4>
                <div className="flex gap-4">
                  <a
                    href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-4 rounded-2xl border border-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    View Document
                  </a>
                  <a
                    href={`http://localhost:5000/api/requests/proof/${selectedRequest.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                    download
                    className="flex-1 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold py-4 rounded-2xl shadow-xl shadow-primary-600/20 transition-all flex items-center justify-center gap-3"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            )}

            {selectedRequest.requestType === 'On Duty' && !selectedRequest.proofFile && (
              <div className="bg-red-500/5 p-8 rounded-[2.5rem] border border-red-500/10 text-center">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  No file uploaded
                </p>
              </div>
            )}

            {/* Action Form Section */}
            {selectedRequest.status === 'Pending' && (
              <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-10 space-y-6 shadow-2xl">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-primary-600/10 rounded-xl text-primary-500">
                    <MessageSquare size={20} />
                  </div>
                  <h4 className="text-xl font-black italic uppercase">Add Your Remarks</h4>
                </div>
                <textarea 
                  placeholder="Optionally provide feedback or reasons for your decision..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[140px] resize-none transition-all placeholder:text-slate-700 font-medium"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedRequest._id, 'approve')}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-600/20 active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle size={22} /> Approve Request
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction(selectedRequest._id, 'reject')}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/20 active:scale-95 disabled:opacity-50"
                  >
                    <XCircle size={22} /> Reject Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HODDashboard;
