import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  RefreshCcw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [hods, setHods] = useState([]);
  const [editResStatus, setEditResStatus] = useState('Dayscholar');
  const [editSecurityType, setEditSecurityType] = useState('Boys Hostel');

  const securityDefaults = {
    'Boys Hostel':  { name: 'Boys Hostel Security',  userId: 'BHSEC' },
    'Girls Hostel': { name: 'Girls Hostel Security', userId: 'GHSEC' },
    'Main Gate':    { name: 'Main Gate Security',    userId: 'MGSEC' },
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/users?role=${roleFilter}&search=${searchTerm}`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await api.get('/users?role=All');
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Error deleting user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/users/${id}/status`);
      toast.success('Status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const handleResetPassword = async (id) => {
    try {
      await api.post(`/users/${id}/reset-password`);
      toast.success('Password reset to default');
    } catch (error) {
      toast.error('Error resetting password');
    }
  };

  const getUserNameById = (id) => {
    if (!id) return 'Not Assigned';
    const found = users.find(u => u.userId === id);
    return found ? found.name : id;
  };

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="Manage Users" />
      
      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-3xl border border-slate-800">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary-500" />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
            >
              <option value="All">All Roles</option>
              <option value="Student">Students</option>
              <option value="Staff">Staff</option>
              <option value="HOD">HODs</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-widest bg-slate-950/50">
                  <th className="px-8 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Gender</th>
                  <th className="px-6 py-4 font-bold">Department</th>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-8 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-8 py-5 bg-slate-900/10 h-20"></td>
                    </tr>
                  ))
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-primary-500">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-none mb-1">{u.name}</p>
                            <p className="text-xs text-slate-500 font-mono">#{u.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                          {u.role}
                        </span>
                        {u.role === 'staff' && u.staffType && (
                          <span className="text-[10px] text-primary-500 font-bold uppercase mt-1">
                            {u.staffType}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-400 capitalize">{u.gender || 'N/A'}</td>
                      <td className="px-6 py-5 text-sm text-slate-400">{u.department || 'N/A'}</td>
                      <td className="px-6 py-5 text-sm text-slate-400 font-medium">{u.email}</td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-all">
                          <button
                            onClick={() => { setSelectedUser(u); setIsViewModalOpen(true); }}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all shadow-lg hover:shadow-primary-600/10"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => { 
                              setSelectedUser(u); 
                              setEditResStatus(u.residentialStatus || 'Dayscholar'); 
                              setEditSecurityType(u.securityType || 'Boys Hostel');
                              setIsEditModalOpen(true); 
                            }}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-primary-500 transition-all shadow-lg hover:shadow-primary-600/10"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u._id)}
                            className={`p-2 bg-slate-800 border border-slate-700 rounded-lg transition-all ${
                              u.status === 'active' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10'
                            }`}
                            title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <ShieldAlert size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="p-2 bg-red-950/50 border border-red-900/50 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-500 italic">
                      No users found. Try searching with different terms.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsViewModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-6 items-center">
                  <div className="h-20 w-20 rounded-2xl bg-primary-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary-600/30">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selectedUser.name}</h2>
                    <p className="text-slate-500 flex items-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold uppercase tracking-widest text-primary-500">
                        {selectedUser.role} 
                      </span>
                      • Username: #{selectedUser.userId}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                  <XCircle size={28} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Current Status</h4>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                  <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                      {selectedUser.role === 'security' ? 'Security Unit' : 'Department'}
                    </h4>
                    <p className="text-white font-bold">
                      {selectedUser.role === 'security' ? (selectedUser.securityType || 'N/A') : (selectedUser.department || 'N/A')}
                    </p>
                  </div>
                </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 text-sm">
                    <span className="text-slate-500">Email Address</span>
                    <span className="text-white font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 text-sm">
                    <span className="text-slate-500">Phone Number</span>
                    <span className="text-white font-medium">{selectedUser.phone || 'N/A'}</span>
                  </div>
                  {selectedUser.role === 'student' && (
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 text-sm">
                      <span className="text-slate-500">Parent Phone</span>
                      <span className="text-white font-medium">{selectedUser.parentPhone || 'N/A'}</span>
                    </div>
                  )}
                  {selectedUser.role === 'security' && selectedUser.securityType && (
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 text-sm">
                      <span className="text-slate-500">Security Unit</span>
                      <span className="text-primary-400 font-bold">{selectedUser.securityType}</span>
                    </div>
                  )}
                  {selectedUser.role === 'staff' && (
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 text-sm">
                      <span className="text-slate-500">Staff Type</span>
                      <span className="text-primary-500 font-bold uppercase">{selectedUser.staffType || 'Regular Staff'}</span>
                    </div>
                  )}
                  {selectedUser.role === 'student' && (
                    <div className="flex justify-between items-center border-b border-slate-800/50 pb-4 text-sm">
                      <span className="text-slate-500">Residential</span>
                      <span className="text-white font-medium">{selectedUser.residentialStatus}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50 space-y-4">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary-500">Assigned Incharges</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedUser.mentorId && (
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Mentor</p>
                          <p className="text-sm font-bold text-white">{getUserNameById(selectedUser.mentorId)} <span className="text-[10px] opacity-40 font-mono">#{selectedUser.mentorId}</span></p>
                        </div>
                      )}
                      {selectedUser.wardenId && (
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Warden</p>
                          <p className="text-sm font-bold text-white">{getUserNameById(selectedUser.wardenId)} <span className="text-[10px] opacity-40 font-mono">#{selectedUser.wardenId}</span></p>
                        </div>
                      )}
                      {selectedUser.hodId && (
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">HOD</p>
                          <p className="text-sm font-bold text-white">{getUserNameById(selectedUser.hodId)} <span className="text-[10px] opacity-40 font-mono">#{selectedUser.hodId}</span></p>
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-xl"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
               <h2 className="text-3xl font-black text-white mb-2 italic uppercase">Edit Identity</h2>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">Updating Profile for #{selectedUser.userId}</p>
               
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 const formData = new FormData(e.target);
                 const data = Object.fromEntries(formData.entries());
                 try {
                   await api.put(`/users/${selectedUser._id}`, data);
                   toast.success('User updated successfully');
                   setIsEditModalOpen(false);
                   fetchUsers();
                 } catch (err) {
                   toast.error(err.response?.data?.message || 'Failed to update user');
                 }
               }} className="space-y-6">
                 {/* Role is hidden but used for backend validation */}
                 <input type="hidden" name="role" value={selectedUser.role} />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {selectedUser.role !== 'security' ? (
                     <>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                         <input name="userId" defaultValue={selectedUser.userId} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none uppercase font-mono" required />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                         <input name="name" defaultValue={selectedUser.name} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" required />
                       </div>
                     </>
                   ) : (
                     <>
                       <input type="hidden" name="userId" value={securityDefaults[editSecurityType]?.userId || selectedUser.userId} />
                       <input type="hidden" name="name" value={securityDefaults[editSecurityType]?.name || selectedUser.name} />
                     </>
                   )}
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email ID</label>
                     <input name="email" defaultValue={selectedUser.email} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" required />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                     <select name="gender" defaultValue={selectedUser.gender || 'Male'} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white">
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                     </select>
                   </div>
                   {selectedUser.role === 'security' ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Security Unit</label>
                        <select
                          name="securityType"
                          value={editSecurityType}
                          onChange={(e) => setEditSecurityType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white"
                        >
                          <option value="Boys Hostel">Boys Hostel</option>
                          <option value="Girls Hostel">Girls Hostel</option>
                          <option value="Main Gate">Main Gate</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                        <input name="department" defaultValue={selectedUser.department} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" />
                      </div>
                    )}
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                     <input name="phone" defaultValue={selectedUser.phone} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" />
                   </div>
                   {selectedUser.role === 'student' && (
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parent Phone</label>
                       <input name="parentPhone" defaultValue={selectedUser.parentPhone} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" />
                     </div>
                   )}
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-primary-500">Update Password (Leave blank to keep current)</label>
                     <input name="password" type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none" />
                   </div>
                   {selectedUser.role === 'staff' && (
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Staff Type</label>
                       <select name="staffType" defaultValue={selectedUser.staffType} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white">
                         <option value="Staff">Regular Staff</option>
                         <option value="Mentor">Mentor</option>
                         <option value="Warden">Warden</option>
                       </select>
                     </div>
                   )}
                   {(selectedUser.role === 'student' || selectedUser.role === 'staff') && (
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign HOD</label>
                       <select name="hodId" defaultValue={selectedUser.hodId || ''} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white">
                         <option value="">Select HOD</option>
                         {hods.map(h => <option key={h.userId} value={h.userId}>{h.name} ({h.userId})</option>)}
                       </select>
                     </div>
                   )}
                   {selectedUser.role === 'student' && (
                     <>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Mentor</label>
                         <select name="mentorId" defaultValue={selectedUser.mentorId || ''} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white" required>
                           <option value="">Select Mentor</option>
                           {mentors.map(m => <option key={m.userId} value={m.userId}>{m.name} ({m.userId})</option>)}
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Residential Status</label>
                         <select 
                           name="residentialStatus" 
                           value={editResStatus} 
                           onChange={(e) => setEditResStatus(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white"
                         >
                           <option value="Dayscholar">Dayscholar</option>
                           <option value="Hosteller">Hosteller</option>
                         </select>
                       </div>
                       {editResStatus === 'Hosteller' && (
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assign Warden</label>
                           <select name="wardenId" defaultValue={selectedUser.wardenId || ''} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/50 outline-none text-white" required>
                             <option value="">Select Warden</option>
                             {wardens.map(w => <option key={w.userId} value={w.userId}>{w.name} ({w.userId})</option>)}
                           </select>
                         </div>
                       )}
                     </>
                   )}
                 </div>

                 <div className="pt-8 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancel</button>
                    <button type="submit" className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-black rounded-2xl shadow-xl shadow-primary-600/20 active:scale-95 transition-all uppercase text-[10px] tracking-widest">Commit Changes</button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUsers;

