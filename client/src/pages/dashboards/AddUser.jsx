import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import { UserPlus, User, Mail, Phone, BookOpen, UserCheck, Shield, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddUser = () => {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    role: 'student',
    gender: 'Male',
    department: '',
    phone: '',
    parentPhone: '',
    mentorId: '',
    hodId: '',
    residentialStatus: 'Dayscholar',
    wardenId: '',
    staffType: 'Staff',
    securityType: 'Boys Hostel',
  });

  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [hods, setHods] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await api.get('/users');
        const allUsers = response.data;
        const staffUsers = allUsers.filter(u => u.role === 'staff');
        setMentors(staffUsers.filter(u => u.staffType === 'Mentor'));
        setWardens(staffUsers.filter(u => u.staffType === 'Warden'));
        setHods(allUsers.filter(u => u.role === 'hod'));
      } catch (error) {
        console.error('Error fetching staff list');
      }
    };
    fetchStaff();
  }, []);

  const roles = [
    { value: 'student', label: 'Student', icon: User },
    { value: 'staff', label: 'Staff', icon: UserCheck },
    { value: 'hod', label: 'HOD', icon: Shield },
    { value: 'security', label: 'Security', icon: Shield },
  ];

  // Auto-assign name + userId for security accounts based on unit
  const securityDefaults = {
    'Boys Hostel':  { name: 'Boys Hostel Security',  userId: 'BHSEC' },
    'Girls Hostel': { name: 'Girls Hostel Security', userId: 'GHSEC' },
    'Main Gate':    { name: 'Main Gate Security',    userId: 'MGSEC' },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // When security type changes OR role is switched to security, sync the auto-generated name + userId
      if ((name === 'securityType') || (name === 'role' && value === 'security')) {
        const secType = name === 'securityType' ? value : updated.securityType;
        const defaults = securityDefaults[secType];
        if (defaults) {
          updated.name = defaults.name;
          updated.userId = defaults.userId;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', formData);
      toast.success('User added successfully!');
      // Reset form but keep role
      setFormData({
        userId: '',
        name: '',
        email: '',
        role: formData.role,
        gender: 'Male',
        department: '',
        phone: '',
        parentPhone: '',
        mentorId: '',
        hodId: '',
        residentialStatus: 'Dayscholar',
        wardenId: '',
        staffType: 'Staff', // Keep staffType for staff role
        securityType: 'Boys Hostel',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50 overflow-hidden">
      <Header title="Add New User" />
      
      <main className="p-8 max-w-4xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-600/10 text-primary-500 rounded-2xl">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">User Information</h3>
              <p className="text-sm text-slate-500 mt-1">Fill in the details to create a new system user.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Select User Role</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: role.value }))}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                      formData.role === role.value
                        ? 'bg-primary-600/10 border-primary-500 text-primary-500 ring-2 ring-primary-500/20'
                        : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <role.icon className="h-6 w-6" />
                    <span className="text-xs font-bold uppercase tracking-wider">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Common Fields */}
              {formData.role !== 'security' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">
                     {formData.role === 'student' ? 'Student Id' : formData.role === 'staff' ? 'Staff Id' : 'Hod Id'}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                    <input
                      name="userId"
                      value={formData.userId}
                      onChange={handleChange}
                      required
                      placeholder={
                        formData.role === 'student' ? 'e.g. 7376CS101' :
                        formData.role === 'staff' ? 'e.g. SCS1230' : 'e.g. HCS2414'
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium uppercase"
                    />
                  </div>
                  {(formData.role === 'student' || formData.role === 'staff' || formData.role === 'hod') && (
                    <p className="text-[9px] text-slate-600 ml-1 font-bold tracking-widest uppercase">
                      Format: {formData.role === 'student' ? '7376[DEPT][ROLL]' : formData.role === 'hod' ? 'H[DEPT][ROLL]' : 'S[DEPT][ROLL]'}
                    </p>
                  )}
                </div>
              )}

              {formData.role !== 'security' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter full name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={
                      formData.role === 'student' ? 'name.dept@student.edu' :
                      formData.role === 'hod' ? 'name.dept@hod.edu' :
                      formData.role === 'staff' ? 'name.dept@staff.edu' : 'name@security.com'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                  />
                </div>
                {formData.role !== 'security' && (
                  <p className="text-[9px] text-slate-600 ml-1 font-bold tracking-widest uppercase">
                    Suffix: @{formData.role === 'student' ? 'student.edu' : formData.role === 'hod' ? 'hod.edu' : 'staff.edu'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-white appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 234 567 890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Conditional Fields based on Role */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={formData.role}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Department (Common to Stud, Staff, HOD) */}
                  {(formData.role === 'student' || formData.role === 'staff' || formData.role === 'hod') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Department</label>
                      <input
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        placeholder="Computer Science / AI / IT"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                      />
                    </div>
                  )}

                  {(formData.role === 'student' || formData.role === 'staff') && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Shield className="h-3 w-3 text-primary-500" />
                        Assign HOD
                      </label>
                      <select
                        name="hodId"
                        value={formData.hodId}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium appearance-none text-sm"
                      >
                        <option value="">Select HOD</option>
                        {hods.map(h => (
                          <option key={h.userId} value={h.userId}>{h.name} ({h.userId})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Role for Security */}
                  {formData.role === 'security' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Security Unit</label>
                      <select
                        name="securityType"
                        value={formData.securityType}
                        onChange={handleChange}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-white"
                      >
                        <option value="Boys Hostel">Boys Hostel</option>
                        <option value="Girls Hostel">Girls Hostel</option>
                        <option value="Main Gate">Main Gate</option>
                      </select>
                    </div>
                  )}

                  {/* Staff Specific Fields */}
                  {formData.role === 'staff' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Shield className="h-3 w-3 text-primary-500" />
                          Staff Role / Type
                        </label>
                        <select
                          name="staffType"
                          value={formData.staffType}
                          onChange={handleChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium appearance-none"
                        >
                          <option value="Staff">Regular Staff</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Warden">Warden</option>
                        </select>
                        <p className="text-[10px] text-slate-500 mt-2">
                          Mentors and Wardens have approval authority for student requests.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {formData.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Parent Phone Number</label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
                          <input
                            name="parentPhone"
                            value={formData.parentPhone}
                            onChange={handleChange}
                            required
                            placeholder="+1 234 567 890"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <UserCheck className="h-3 w-3 text-primary-500" />
                          Assign Mentor
                        </label>
                        <select
                          name="mentorId"
                          value={formData.mentorId}
                          onChange={handleChange}
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium appearance-none"
                        >
                          <option value="">Select Mentor</option>
                          {mentors.map(m => (
                            <option key={m.userId} value={m.userId}>{m.name} ({m.userId})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1 uppercase tracking-widest text-[10px]">Residential Status</label>
                        <div className="flex gap-4">
                          {['Dayscholar', 'Hosteller'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, residentialStatus: status }))}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl transition-all ${
                                formData.residentialStatus === status
                                  ? 'bg-primary-600/10 border-primary-500 text-primary-500'
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}
                            >
                              <Home className="h-4 w-4" />
                              <span className="text-xs font-bold">{status}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formData.residentialStatus === 'Hosteller' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Home className="h-3 w-3 text-primary-500" />
                            Assign Warden
                          </label>
                          <select
                            name="wardenId"
                            value={formData.wardenId}
                            onChange={handleChange}
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium appearance-none"
                          >
                            <option value="">Select Warden</option>
                            {wardens.map(w => (
                              <option key={w.userId} value={w.userId}>{w.name} ({w.userId})</option>
                            ))}
                          </select>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pt-8 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                Register User
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default AddUser;
