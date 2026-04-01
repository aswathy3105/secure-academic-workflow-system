import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/Header';
import { 
  FilePlus, 
  Send, 
  Info, 
  Calendar, 
  Clock,
  Layout,
  Type,
  AlignLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/DatePicker.css';
import { format, startOfDay } from 'date-fns';
import TimePicker from '../../components/TimePicker';
import OverlapErrorModal from '../../components/modals/OverlapErrorModal';

import { useAuth } from '../../context/AuthContext';

const AddStaffRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestType: 'Leave',
    title: '',
    description: '',
    fromTime: '09:00 AM',
    toTime: '05:00 PM',
    goingOut: 'No'
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [errorFields, setErrorFields] = useState([]);
  const [showOverlapModal, setShowOverlapModal] = useState(false);

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const convertToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const startMin = convertToMinutes(formData.fromTime);
    const endMin = convertToMinutes(formData.toTime);
    let totalMin = (diffDays - 1) * 24 * 60 + (endMin - startMin);
    
    if (totalMin < 0) totalMin = 0;

    const days = Math.floor(totalMin / (24 * 60));
    const hours = Math.floor((totalMin % (24 * 60)) / 60);
    
    let durationStr = "Total: ";
    if (days > 0) durationStr += `${days} ${days === 1 ? 'Day' : 'Days'}`;
    if (hours > 0) durationStr += `${days > 0 ? ', ' : ''}${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
    if (days === 0 && hours === 0) durationStr += "0 Hours (Check Time)";
    
    return durationStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDetailed && (!startDate || !endDate)) {
      toast.error('Please select a valid date range');
      setErrorFields(['dates']);
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        fromDate: format(startDate, 'yyyy-MM-dd'),
        toDate: format(endDate, 'yyyy-MM-dd')
      };
      await api.post('/requests', submissionData);
      toast.success('Request submitted to HOD successfully!');
      navigate('/staff/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit request';
      if (errorMsg.toLowerCase().includes('overlaps with an existing request')) {
        setErrorFields(['dates', 'times']);
        setShowOverlapModal(true);
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isDetailed = formData.requestType === 'Leave' || formData.requestType === 'On Duty';

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50 overflow-y-auto custom-scrollbar">
      <Header title="New Submission" />
      
      <main className="p-8 max-w-4xl mx-auto pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          <div>
            <h2 className="text-3xl font-black">Create Staff Request</h2>
            <p className="text-slate-500 mt-2 text-sm">Submit your professional leave or on-duty requests directly to your HOD.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Request Type Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Leave', 'On Duty', 'Other'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, requestType: type })}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${
                    formData.requestType === type 
                      ? 'bg-primary-600/10 border-primary-500 text-primary-500 shadow-xl shadow-primary-500/10' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Type size={24} />
                  <span className="font-bold text-sm uppercase tracking-widest">{type}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-10">
                {/* Basic Info */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Layout size={12} className="text-primary-500" /> Request Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Brief title for your request"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <AlignLeft size={12} className="text-primary-500" /> Detailed Description
                    </label>
                    <textarea
                      required
                      placeholder="Explain the reason for your request..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-3xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none min-h-[150px] transition-all"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                {isDetailed && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-10 border-t border-slate-800 space-y-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Calendar size={12} className="text-primary-500" /> Select Date Range
                      </label>
                      <div className="relative z-30">
                        <DatePicker
                          selectsRange={true}
                          startDate={startDate}
                          endDate={endDate}
                          onChange={(update) => {
                            const [start, end] = update;
                            setStartDate(start);
                            setEndDate(end);
                          }}
                          minDate={startOfDay(new Date())}
                          placeholderText="Click to select start and end dates"
                          className={`w-full bg-slate-950 border ${errorFields.includes('dates') ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-slate-800'} rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none text-white cursor-pointer transition-all hover:border-slate-700 font-bold`}
                          dateFormat="dd MMM yyyy"
                          shouldCloseOnSelect={true}
                          onFocus={() => setErrorFields(prev => prev.filter(f => f !== 'dates'))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <TimePicker
                        label="Start Time"
                        value={formData.fromTime}
                        onChange={(val) => setFormData({ ...formData, fromTime: val })}
                        error={errorFields.includes('times')}
                      />
                      <TimePicker
                        label="End Time"
                        value={formData.toTime}
                        onChange={(val) => setFormData({ ...formData, toTime: val })}
                        error={errorFields.includes('times')}
                      />
                    </div>

                    <AnimatePresence>
                      {startDate && endDate && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-primary-500/5 border border-primary-500/20 rounded-2xl p-4 flex items-center justify-between"
                        >
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary-600/10 text-primary-500 rounded-lg">
                                <Clock size={16} />
                              </div>
                              <span className="text-sm font-black text-primary-500 uppercase tracking-widest">
                                {calculateDuration()}
                              </span>
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Selected Range Validated</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {user?.staffType?.toLowerCase() === 'warden' && (formData.requestType === 'Leave' || formData.requestType === 'On Duty') && (
                       <div className="space-y-3 pt-4">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Info size={12} className="text-primary-500" /> Going Out
                         </label>
                         <select
                           value={formData.goingOut}
                           onChange={(e) => setFormData({ ...formData, goingOut: e.target.value })}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary-500/50 focus:outline-none"
                         >
                           <option value="No">No</option>
                           <option value="Yes">Yes</option>
                         </select>
                         <p className="text-[10px] text-slate-500 italic">Selecting 'Yes' will enable Main Gate OTP verification upon HOD approval.</p>
                       </div>
                    )}
                  </motion.div>
                )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-5 px-16 rounded-[2rem] flex items-center gap-4 transition-all shadow-2xl shadow-primary-600/30 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Forward to HOD'}
                <Send size={18} />
              </button>
            </div>
          </form>

          <div className="bg-primary-500/5 border border-primary-500/10 p-8 rounded-3xl flex items-start gap-4">
             <Info className="text-primary-500 mt-1" size={20} />
             <div>
               <p className="text-xs font-bold text-primary-200 uppercase tracking-widest mb-1">Workflow Information</p>
               <p className="text-sm text-primary-200/60 leading-relaxed">
                 All staff requests are automatically forwarded to the Head of Department (HOD) for review. You can track the approval status from your dashboard.
               </p>
             </div>
          </div>
        </motion.div>
      </main>
      <OverlapErrorModal 
        isOpen={showOverlapModal} 
        onClose={() => setShowOverlapModal(false)} 
      />
    </div>
  );
};

export default AddStaffRequest;
