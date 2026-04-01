import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import { 
  FilePlus, 
  Calendar, 
  Clock, 
  Type, 
  AlignLeft,
  ChevronRight,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/DatePicker.css';
import { format, isAfter, isSameDay, startOfDay } from 'date-fns';
import TimePicker from '../../components/TimePicker';
import OverlapErrorModal from '../../components/modals/OverlapErrorModal';

const AddRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
   const [startDate, setStartDate] = useState(null);
   const [endDate, setEndDate] = useState(null); // Separate states for range validation
  const [errorFields, setErrorFields] = useState([]);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  
  const [formData, setFormData] = useState({
    requestType: 'Leave',
    title: '',
    description: '',
    fromTime: '09:00 AM',
    toTime: '05:00 PM',
    venue: 'Seminar hall',
    accommodation: 'No',
  });

  const getRequestTypes = () => {
    return ['Leave', 'On Duty', 'Emergency Leave', 'Other', 'Event'];
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      toast.success('✔ File uploaded successfully');
    } else if (file) {
      toast.error('Please upload a PDF document only');
      e.target.value = '';
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for Dates
    if (isDetailedType && (!startDate || !endDate)) {
      toast.error('Please select a valid date range');
      setErrorFields(['dates']);
      return;
    }

    // Validation for Time (if same day)
    if (isDetailedType && isSameDay(startDate, endDate)) {
      const startT = new Date(`2000-01-01 ${formData.fromTime}`);
      const endT = new Date(`2000-01-01 ${formData.toTime}`);
      if (!isAfter(endT, startT)) {
        toast.error('End time must be after start time');
        setErrorFields(['times']);
        return;
      }
    }

    // Validation for On Duty
    if (formData.requestType === 'On Duty' && !selectedFile) {
      toast.error('Proof document is required for On Duty request');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      if (startDate) data.append('fromDate', format(startDate, 'yyyy-MM-dd'));
      if (endDate) data.append('toDate', format(endDate, 'yyyy-MM-dd'));

      if (selectedFile) {
        data.append('proofFile', selectedFile);
      }

      await api.post('/requests', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Request submitted successfully!');
      navigate('/student/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error submitting request';
      if (errorMsg.toLowerCase().includes('overlaps with an existing request')) {
        setErrorFields(['dates', 'times']);
        setShowOverlapModal(true);
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowHint = () => {
    const isHosteller = profile?.residentialStatus === 'Hosteller';
    switch (formData.requestType) {
      case 'Emergency Leave': 
        return isHosteller ? 'Direct Warden Approval' : 'Mentor → Gate Approval';
      case 'Event':
        return 'Mentor & HOD Approval';
      case 'Other': 
        return 'Mentor Approval Only';
      default: 
        return isHosteller ? 'Mentor → Warden Approval' : 'Mentor Approval Only';
    }
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Simple time calculation for the same day or multi-day
    // For simplicity, we just show days and hours if needed, 
    // but the requirement says "Total: 2 Days, 4 Hours".
    // Let's calculate hours from fromTime/toTime.
    
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

  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const isDetailedType = formData.requestType !== 'Other';
  const isEventType = formData.requestType === 'Event';

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="New Submission" />
      
      <main className="p-8 max-w-3xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl transition-all"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-primary-600/10 text-primary-500 rounded-2xl">
              <FilePlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Create Request</h3>
              <p className="text-sm text-slate-500">Submit a new academic or leave request.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Request Type</label>
                <span className="text-[10px] font-black bg-primary-600/10 text-primary-500 px-3 py-1 rounded-full uppercase tracking-tighter animate-pulse">
                  {getWorkflowHint()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getRequestTypes().map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, requestType: type }));
                      setIsAnimationComplete(false); // Reset on type change
                    }}
                    className={`px-4 py-3 rounded-xl border text-[10px] font-black transition-all uppercase tracking-widest ${
                      formData.requestType === type
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{isEventType ? 'Event Name' : 'Title'}</label>
              <div className="relative group">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Leave for 2 days"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
              <div className="relative group">
                <AlignLeft className="absolute left-4 top-4 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Provide detailed reason..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
                />
              </div>
            </div>

            <AnimatePresence>
              {formData.requestType === 'On Duty' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 pt-2 overflow-hidden"
                  onAnimationComplete={() => setIsAnimationComplete(true)}
                >
                  <label className="text-xs font-bold text-primary-500 uppercase tracking-widest ml-1">Upload Proof Document (PDF Only)</label>
                  <div className="relative group">
                    <div className={`w-full bg-slate-950 border-2 border-dashed ${selectedFile ? 'border-primary-500/50 bg-primary-500/5' : 'border-slate-800'} rounded-2xl p-6 transition-all hover:border-primary-500/30 flex flex-col items-center justify-center gap-3`}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                      <div className={`p-3 rounded-full ${selectedFile ? 'bg-primary-500/20 text-primary-500' : 'bg-slate-800 text-slate-500'}`}>
                        <FilePlus size={24} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${selectedFile ? 'text-white' : 'text-slate-400'}`}>
                          {selectedFile ? selectedFile.name : 'Click to upload proof document'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">MAX 5MB • PDF ONLY</p>
                        {selectedFile && filePreviewUrl && (
                          <div className="mt-4 relative z-20">
                            <a
                              href={filePreviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-600/20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View PDF
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isDetailedType && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onAnimationComplete={() => setIsAnimationComplete(true)}
                  className={`${isAnimationComplete ? '' : 'overflow-hidden'} space-y-6 pt-2`}
                >
                  {/* Separate Date Pickers (Popups) */}
                  {/* Range Date Picker */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Date Range</label>
                      <div className="relative group z-30">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
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
                          className={`w-full bg-slate-950 border ${errorFields.includes('dates') ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-slate-800'} rounded-2xl px-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white cursor-pointer transition-all hover:border-slate-700 font-bold`}
                          dateFormat="dd MMM yyyy"
                          shouldCloseOnSelect={true}
                          onFocus={() => setErrorFields(prev => prev.filter(f => f !== 'dates'))}
                        />
                      </div>
                  </div>

                  {/* Advanced Time Range Pickers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TimePicker
                      label="From Time"
                      value={formData.fromTime}
                      onChange={(val) => setFormData({ ...formData, fromTime: val })}
                      error={errorFields.includes('times')}
                    />
                    <TimePicker
                      label="To Time"
                      value={formData.toTime}
                      onChange={(val) => setFormData({ ...formData, toTime: val })}
                      error={errorFields.includes('times')}
                    />
                  </div>

                  {isEventType && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/50"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-primary-500">Event Venue Arrangement</label>
                        <select
                          name="venue"
                          value={formData.venue}
                          onChange={handleChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white appearance-none"
                        >
                          <option value="Seminar hall">Seminar hall</option>
                          <option value="Auditorium">Auditorium</option>
                          <option value="classroom">classroom</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-primary-500">Accommodation Provide</label>
                        <select
                          name="accommodation"
                          value={formData.accommodation}
                          onChange={handleChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-white appearance-none"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isDetailedType && startDate && endDate && (
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

            <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-grow md:flex-none px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      <OverlapErrorModal 
        isOpen={showOverlapModal} 
        onClose={() => setShowOverlapModal(false)} 
      />
    </div>
  );
};

export default AddRequest;
