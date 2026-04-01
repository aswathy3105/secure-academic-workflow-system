import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FileText, Settings, ShieldAlert, BookOpen } from 'lucide-react';

const DashboardShell = ({ title, icon: Icon, stats, recentItems, loading }) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-600/20 rounded-2xl">
              <Icon className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-slate-400">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse h-32"></div>
            ))
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-primary-500/50 transition-colors">
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                {stat.trend && (
                  <div className={`mt-2 text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.trend} from last month
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent Activity Table (Simulated) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold">Recent Requests</h3>
            <button className="text-xs text-primary-500 font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentItems.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">#{item.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{item.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'Approved' ? 'bg-green-500/10 text-green-500' : 
                        item.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardShell;
