import { Eye, Check, X, MessageSquare, ExternalLink, Download } from 'lucide-react';
import StatusBadge from './StatusBadge';

const RequestTable = ({ requests, loading, onView, onApprove, onReject }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] bg-slate-950/50">
              <th className="px-8 py-6 font-black">Id</th>
              <th className="px-8 py-6 font-black text-center">Type</th>
              <th className="px-8 py-6 font-black">Role</th>
              <th className="px-8 py-6 font-black text-center">Title</th>
              <th className="px-8 py-6 font-black text-center uppercase tracking-[0.2em]">Date</th>
              <th className="px-8 py-6 font-black text-center uppercase tracking-[0.2em]">proof</th>
              <th className="px-8 py-6 font-black text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 text-sm">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-8 py-6 h-20"></td>
                </tr>
              ))
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-800/20 transition-all group border-b border-slate-800/30 last:border-0">
                  <td className="px-8 py-6 font-mono text-xs text-slate-500 uppercase tracking-tighter">#{req.requesterId}</td>
                  <td className="px-8 py-6 text-center">
                    <StatusBadge status={req.requestType} />
                  </td>
                  <td className="px-8 py-6 font-bold text-white uppercase text-[10px] tracking-widest leading-relaxed">
                    {req.requesterRole === 'student' ? 'Student' : 
                     `Staff (${req.requesterStaffType || 'Regular Staff'})`}
                  </td>
                  <td className="px-8 py-6 text-center font-medium text-slate-300 max-w-[200px] truncate">{req.title}</td>
                  <td className="px-8 py-6 text-center text-xs text-slate-500 font-bold uppercase whitespace-nowrap">
                    {new Date(req.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    {req.proofFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <a 
                          href={`http://localhost:5000/api/requests/proof/${req.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-800 hover:bg-primary-600 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
                          title="View PDF"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <a 
                          href={`http://localhost:5000/api/requests/proof/${req.proofFile.split('/').pop()}?token=${localStorage.getItem('token')}`}
                          download
                          className="p-2 bg-slate-800 hover:bg-primary-600 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center block">N/A</span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-3 transition-all duration-300">
                      <button 
                        onClick={() => onView(req)}
                        className="p-3 bg-slate-800 hover:bg-primary-600 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 border border-slate-700/50"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => onApprove(req)}
                        className="p-3 bg-slate-800 hover:bg-green-600 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 border border-slate-700/50"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => onReject(req)}
                        className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-400 hover:text-white transition-all shadow-xl active:scale-90 border border-slate-700/50"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-8 py-24 text-center text-slate-500 font-bold italic bg-slate-900/50">
                   No pending requests found. Dashboard clear!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestTable;
