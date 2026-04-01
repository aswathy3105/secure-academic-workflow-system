import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-primary-500" />
        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Academic <span className="text-primary-500 text-sm font-medium uppercase tracking-widest">Portal</span>
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-100">{user.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-primary-400 font-bold">{user.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
