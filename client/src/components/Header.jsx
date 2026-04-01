import { useAuth } from '../context/AuthContext';
import { Bell, Search } from 'lucide-react';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Academic Workflow Management System</p>
      </div>


    </header>
  );
};

export default Header;
