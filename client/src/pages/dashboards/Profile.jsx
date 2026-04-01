import { useState, useEffect } from 'react';
import api from '../../services/api';
import Header from '../../components/Header';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  MapPin, 
  BookOpen,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="flex-grow bg-slate-950 min-h-screen flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-primary-600/20 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!profile) return (
    <div className="flex-grow bg-slate-950 min-h-screen p-8 text-center text-slate-500">
      Profile not found.
    </div>
  );

  const getInfoItems = () => {
    const common = [
      { label: 'Name', value: profile.name, icon: User },
      { label: 'Gender', value: profile.gender, icon: User },
      { label: 'Email ID', value: profile.email, icon: Mail },
      { label: 'Phone Number', value: profile.phone, icon: Phone },
    ];

    const role = profile.role?.toLowerCase();

    switch (role) {
      case 'student':
        const studentItems = [
          { label: 'Student ID', value: profile.userId, icon: User, mono: true },
          ...common,
          { label: 'Parent Phone', value: profile.parentPhone, icon: Phone },
          { label: 'Residential Status', value: profile.residentialStatus, icon: MapPin },
          { label: 'Department', value: profile.department, icon: BookOpen },
        ];
        
        if (profile.mentor && profile.mentor.name !== 'N/A') {
          studentItems.push({ label: 'Mentor', value: `${profile.mentor.name} - ${profile.mentor.userId}`, icon: UserCheck });
        }
        
        const resStatus = profile.residentialStatus?.toLowerCase();
        if (resStatus === 'hosteller' && profile.warden && profile.warden.name !== 'N/A') {
          studentItems.push({ label: 'Warden', value: `${profile.warden.name} - ${profile.warden.userId}`, icon: Shield });
        }
        
        if (profile.hod && profile.hod.name !== 'N/A') {
          studentItems.push({ label: 'HOD', value: `${profile.hod.name} - ${profile.hod.userId}`, icon: Shield });
        }
        return studentItems;

      case 'staff':
        const staffItems = [
          { label: 'Staff ID', value: profile.userId, icon: User, mono: true },
          ...common,
          { label: 'Department', value: profile.department, icon: BookOpen },
          { label: 'Role', value: profile.roleType, icon: Shield },
        ];
        if (profile.hod && profile.hod.name !== 'N/A') {
          staffItems.push({ label: 'HOD', value: `${profile.hod.name} - ${profile.hod.userId}`, icon: Shield });
        }
        return staffItems;

      case 'hod':
        return [
          { label: 'HOD ID', value: profile.userId, icon: User, mono: true },
          ...common,
          { label: 'Department', value: profile.department, icon: BookOpen },
        ];

      case 'security':
        return [
          { label: 'Security ID', value: profile.userId, icon: User, mono: true },
          ...common,
          { label: 'Security Unit', value: profile.securityType, icon: Shield },
        ];

      default:
        return [
          { label: 'User ID', value: profile.userId, icon: User, mono: true },
          ...common,
          { label: 'Role', value: profile.role, icon: Shield },
        ];
    }
  };

  const infoItems = getInfoItems();

  const assignedStaff = []; // We simplified it by including all in infoItems

  return (
    <div className="flex-grow bg-slate-950 min-h-screen text-slate-50">
      <Header title="My Profile" />
      
      <main className="p-8 max-w-5xl mx-auto pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center">
              <div className="h-32 w-32 rounded-3xl bg-primary-600 flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-primary-600/20 mb-6">
                {profile?.name?.charAt(0) || '?'}
              </div>
              <h3 className="text-xl font-bold">{profile?.name || 'User'}</h3>
              <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">
                {profile?.role}
              </p>
              <div className="mt-6 pt-6 border-t border-slate-800 w-full flex justify-center gap-4">
                 <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                    <p className="text-xs font-bold text-green-500 uppercase tracking-widest">{profile.status}</p>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                <span className="h-8 w-1.5 bg-primary-600 rounded-full"></span>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {infoItems.map((item) => {
                  const Icon = item.icon || User;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Icon size={12} className="text-primary-500" />
                        {item.label}
                      </label>
                      <p className={`text-sm font-medium ${item.mono ? 'font-mono text-primary-500' : 'text-slate-200'}`}>
                        {item.value || 'N/A'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {assignedStaff.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                  <span className="h-8 w-1.5 bg-primary-600 rounded-full"></span>
                  Academic Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {assignedStaff.filter(s => s.show !== false).map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <item.icon size={12} className="text-primary-500" />
                        {item.label}
                      </label>
                      <p className="text-sm font-medium text-slate-200">
                        ID: <span className="font-mono text-primary-400">{item.value || 'N/A'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
