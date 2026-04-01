import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  User as UserIcon,
  X,
  ExternalLink,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const handleViewRequest = async (requestId) => {
    setModalLoading(true);
    setIsModalOpen(true);
    try {
      const response = await api.get(`/requests/${requestId}`);
      setSelectedRequest(response.data);
    } catch (error) {
      console.error('Error fetching request details');
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, requestsRes] = await Promise.all([
          api.get('/requests/student/stats'),
          api.get('/requests/my')
        ]);
        setStats(statsRes.data);
        setRequests(requestsRes.data.slice(0, 5)); // Show only latest 5
      } catch (error) {
        console.error('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Requests', value: stats.total, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="Student Dashboard" />
      
      <main className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Welcome back!</h2>
            <p className="text-slate-500 mt-1">Track and manage your academic requests easily.</p>
          </div>
          <Link 
            to="/student/requests/add"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary-600/20 active:scale-95"
          >
            <Plus size={20} />
            New Request
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                  <card.icon size={24} />
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium">{card.title}</h3>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Requests */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg">Recent Requests</h3>
            <Link to="/student/requests/my" className="text-primary-500 text-sm font-bold hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Title</th>
                  <th className="px-6 py-4 font-bold text-center">Submitted Date</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4 h-16"></td>
                    </tr>
                  ))
                ) : requests.length > 0 ? (
                  requests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-800/30 transition-all group font-medium">
                      <td className="px-6 py-4 font-mono text-xs text-white font-bold tracking-tighter">#{req.requesterId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                          req.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          req.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-slate-500/10 text-slate-400 border-slate-800'
                        }`}>
                          {req.requestType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{req.title}</td>
                      <td className="px-6 py-4 text-center text-slate-400 text-xs font-bold">
                        {new Date(req.submittedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          (req.finalStatus || req.status) === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          (req.finalStatus || req.status) === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {req.finalStatus || (['Approved', 'Forwarded to Gate', 'Out', 'Inside'].includes(req.status) ? 'Approved' : req.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleViewRequest(req._id)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-lg shadow-black/20"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      No requests found yet.
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
                      <h2 className="text-3xl font-black tracking-tight">{selectedRequest.title}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          selectedRequest.requestType === 'Emergency Leave' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          selectedRequest.requestType === 'On Duty' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-primary-500/10 text-primary-500 border-primary-500/20'
                        }`}>
                          {selectedRequest.requestType}
                        </span>
                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-800 px-3 py-1 rounded-lg">
                          ID: #{selectedRequest._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* SECTION 1: BASIC DETAILS */}
                    <div className="bg-slate-950/30 p-6 rounded-3xl border border-slate-800/50">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Description</h4>
                       <p className="text-sm text-slate-300 italic leading-relaxed">"{selectedRequest.description}"</p>
                    </div>

                    {/* SECTION 2 & 3: GRID LAYOUT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Student Information */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase">
                          <UserIcon size={14} className="text-primary-500" /> Student Information
                        </h4>
                        <div className="bg-slate-950/20 p-6 rounded-3xl border border-slate-800/30 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Name</p>
                              <p className="text-sm text-white font-bold">{selectedRequest.name}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Student ID</p>
                              <p className="text-sm text-white font-mono">{selectedRequest.requesterId}</p>
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
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Mentor Name</p>
                              <p className="text-xs text-white font-bold">{selectedRequest.mentorName || 'N/A'}</p>
                            </div>
                            {selectedRequest.wardenId && (
                              <div>
                                <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Warden Name</p>
                                <p className="text-xs text-white font-bold">{selectedRequest.wardenName || 'N/A'}</p>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">HOD Name</p>
                              <p className="text-xs text-white font-bold">{selectedRequest.hodName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-600 font-bold uppercase mb-0.5">Submitted On</p>
                              <p className="text-xs text-slate-400 font-bold">{new Date(selectedRequest.submittedDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date & Time */}
                      {selectedRequest.requestType !== 'Other' && (
                        <div className="space-y-6">
                           <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-500 tracking-widest uppercase">
                            <Clock size={14} className="text-primary-500" /> Temporal Context
                          </h4>
                          <div className="bg-slate-950/20 p-6 rounded-3xl border border-slate-800/30 flex flex-col justify-center h-[calc(100%-2rem)]">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                               <div>
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">From Date</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.fromDate}</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">To Date</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.toDate}</p>
                               </div>
                               <div className="pt-4 border-t border-slate-800/30">
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">From Time</p>
                                 <p className="text-sm font-black text-white">{selectedRequest.fromTime}</p>
                               </div>
                               <div className="text-right pt-4 border-t border-slate-800/30">
                                 <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">To Time</p>
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
                          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Workflow Status</h4>
                          <div className="space-y-3">
                             {/* Condition: Not Emergency Hosteller */}
                             {!(selectedRequest.residentialStatus === 'Hosteller' && selectedRequest.requestType === 'Emergency Leave') && (
                               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Mentor</span>
                                  <span className={`text-[10px] font-black uppercase ${selectedRequest.mentorStatus === 'Approved' ? 'text-green-500' : selectedRequest.mentorStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.mentorStatus}</span>
                               </div>
                             )}

                             {/* Condition: Hosteller Leave/OD/Emergency/Other */}
                             {(selectedRequest.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) && (
                               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Warden</span>
                                  <span className={`text-[10px] font-black uppercase ${selectedRequest.wardenStatus === 'Approved' ? 'text-green-500' : selectedRequest.wardenStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.wardenStatus}</span>
                               </div>
                             )}

                             {/* Condition: Event (All) */}
                             {selectedRequest.requestType === 'Event' && (
                               <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">HOD</span>
                                  <span className={`text-[10px] font-black uppercase ${selectedRequest.hodStatus === 'Approved' ? 'text-green-500' : selectedRequest.hodStatus === 'Rejected' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedRequest.hodStatus || 'Pending'}</span>
                               </div>
                             )}

                             <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/20 flex justify-between items-center">
                                <span className="text-[9px] font-black text-primary-500 uppercase">Final Status</span>
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
                          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Remarks & Comments</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {!(selectedRequest.residentialStatus === 'Hosteller' && selectedRequest.requestType === 'Emergency Leave') && (
                               <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                                  <p className="text-[9px] font-bold text-slate-600 uppercase mb-2">Mentor Remarks</p>
                                  <p className="text-xs text-slate-300 italic">"{selectedRequest.mentorRemarks || 'No remarks provided'}"</p>
                               </div>
                             )}
                             {(selectedRequest.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) && (
                               <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                                  <p className="text-[9px] font-bold text-slate-600 uppercase mb-2">Warden Remarks</p>
                                  <p className="text-xs text-slate-300 italic">"{selectedRequest.wardenRemarks || 'No remarks provided'}"</p>
                               </div>
                             )}
                             {selectedRequest.requestType === 'Event' && (
                               <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 shadow-inner">
                                  <p className="text-[9px] font-bold text-slate-600 uppercase mb-2">HOD Remarks</p>
                                  <p className="text-xs text-slate-300 italic">"{selectedRequest.hodRemarks || 'No remarks provided'}"</p>
                               </div>
                             )}
                          </div>
                          
                          {/* Event Specialized Details */}
                          {selectedRequest.requestType === 'Event' && (
                             <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/10 flex flex-col items-center">
                                   <span className="text-[8px] font-black text-primary-500 uppercase mb-1">Venue</span>
                                   <span className="text-xs font-bold text-white uppercase">{selectedRequest.venue || 'N/A'}</span>
                                </div>
                                <div className="bg-primary-500/5 p-4 rounded-2xl border border-primary-500/10 flex flex-col items-center">
                                   <span className="text-[8px] font-black text-primary-500 uppercase mb-1">Accom.</span>
                                   <span className="text-xs font-bold text-white uppercase">{selectedRequest.accommodation || 'No'}</span>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>

                    {/* GATE TRACKING SECTION */}
                    {((selectedRequest.residentialStatus === 'Hosteller' && ['Leave', 'On Duty', 'Emergency Leave'].includes(selectedRequest.requestType)) ||
                    (selectedRequest.residentialStatus === 'Dayscholar' && selectedRequest.requestType === 'Emergency Leave')) && (
                      <div className="bg-slate-950/50 border border-slate-800/50 rounded-[2rem] p-8 space-y-6 shadow-inner">
                         <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-3">Gate Tracking Context</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-slate-950/50 p-5 rounded-3xl border border-slate-800/30">
                               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Gate Out</span>
                               <span className="text-sm font-black text-purple-400 uppercase tracking-tighter">
                                 {selectedRequest.exitTime ? new Date(selectedRequest.exitTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Not yet recorded'}
                               </span>
                            </div>
                            <div className="text-center bg-slate-950/50 p-5 rounded-3xl border border-slate-800/30">
                               <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 block">Gate In</span>
                               <span className="text-sm font-black text-teal-400 uppercase tracking-tighter">
                                 {selectedRequest.entryTime ? new Date(selectedRequest.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Not yet recorded'}
                               </span>
                            </div>
                            {selectedRequest.otp && !selectedRequest.isOtpUsed && (
                              <div className="bg-primary-500/10 p-5 rounded-3xl border border-primary-500/20 flex flex-col items-center justify-center animate-pulse">
                                 <span className="text-[8px] font-black text-primary-500 uppercase tracking-widest mb-1">Security OTP</span>
                                 <span className="text-2xl font-black text-white tracking-[0.2em]">{selectedRequest.otp}</span>
                              </div>
                            )}
                         </div>
                      </div>
                    )}

                    {/* DOCUMENT VIEW SECTION */}
                    {(['On Duty', 'Event'].includes(selectedRequest.requestType)) && (
                      <div className="pt-4">
                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Supporting Documents</h4>
                        {selectedRequest.proofFile ? (
                           <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-primary-500/30 transition-all shadow-xl">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                                    <FileText size={24} />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-white">Proof Document.pdf</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">SECURED PDF DOCUMENT</p>
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
                             <p className="text-slate-600 font-bold italic text-sm">No document uploaded / required for this submission</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-6 border-t border-slate-800 flex justify-end">
                    <button onClick={() => setIsModalOpen(false)} className="px-12 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 text-xs font-black uppercase tracking-widest">
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

export default StudentDashboard;
