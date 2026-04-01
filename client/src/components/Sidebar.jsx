import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Settings as ManageUsersIcon,
  FileText, 
  ChevronDown, 
  ChevronRight, 
  LogOut,
  ShieldCheck,
  PlusCircle,
  User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(
    location.pathname.includes('/users') || location.pathname.includes('/staff/requests')
  );

  const adminMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    {
      label: 'User Management',
      icon: Users,
      path: '/admin/users',
      subItems: [
        { label: 'Add User', icon: UserPlus, path: '/admin/users/add' },
        { label: 'Manage Users', icon: ManageUsersIcon, path: '/admin/users/manage' },
      ]
    },
    { label: 'Requests', icon: FileText, path: '/admin/requests' },
    { label: 'Profile', icon: User, path: '/admin/profile' },
  ];

  const studentMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'Add Request', icon: PlusCircle, path: '/student/requests/add' },
    { label: 'My Requests', icon: FileText, path: '/student/requests/my' },
    { label: 'Profile', icon: User, path: '/student/profile' },
  ];

  const hodMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/hod/dashboard' },
    { label: 'Profile', icon: User, path: '/hod/profile' },
  ];

  const staffMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff/dashboard' },
    { label: 'Add Request', icon: PlusCircle, path: '/staff/requests/add' },
    { label: 'My Requests', icon: FileText, path: '/staff/requests/my' },
    { label: 'Profile', icon: User, path: '/staff/profile' },
  ];

  const securityMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/security/dashboard' },
    { label: 'Profile', icon: User, path: '/security/profile' },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin': return adminMenuItems;
      case 'student': return studentMenuItems;
      case 'hod': return hodMenuItems;
      case 'staff': return staffMenuItems;
      case 'security': return securityMenuItems;
      default: return [];
    }
  };

  const menuItems = getMenuItems();

  const navItems = menuItems;

  if (!user) return null;

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary-600 p-2 rounded-xl">
          <ShieldCheck className="text-white h-6 w-6" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Academic <span className="text-primary-500 font-medium capitalize">Portal</span>
        </span>
      </div>

      <nav className="flex-grow px-4 space-y-2 py-4">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <div>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    location.pathname.includes(item.path)
                      ? 'bg-primary-600/10 text-primary-500'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {userMenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-4 mt-1 space-y-1"
                    >
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.label}
                          to={sub.path}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                              isActive
                                ? 'text-primary-500 bg-primary-600/5'
                                : 'text-slate-500 hover:text-white hover:bg-slate-800/50'
                            }`
                          }
                        >
                          <sub.icon className="h-4 w-4" />
                          <span className="text-xs font-medium">{sub.label}</span>
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-600/10 text-primary-500 shadow-sm shadow-primary-600/10'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all mt-auto mb-2"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
        
        <div className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-white text-xs text-center">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-white truncate">{user?.name}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
