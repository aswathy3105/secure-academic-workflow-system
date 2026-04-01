import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, FileText, Activity, ShieldCheck, 
  Layers, Package, Calendar, UserCheck, GraduationCap
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
const STATUS_COLORS = {
  'Approved': '#10b981',
  'Pending': '#f59e0b',
  'Rejected': '#f43f5e'
};

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState('weekly');

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/requests/admin/analytics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to update analytics');
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Advanced Metrics...</p>
      </div>
    );
  }

  const ChartCard = ({ title, icon: Icon, children, total, extra }) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl hover:shadow-primary-500/5 transition-all group overflow-hidden relative h-full">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-[4] pointer-events-none group-hover:scale-[4.5] transition-transform duration-700">
        <Icon size={40} className="text-primary-500" />
      </div>
      <div className="flex justify-between items-start mb-8 relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-primary-500 shadow-inner">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-[0.2em]">{title}</h3>
            {extra && <div className="mt-1">{extra}</div>}
          </div>
        </div>
        {total !== undefined && (
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter opacity-70">Total Volume</p>
            <p className="text-2xl font-black text-white leading-none mt-1">{total}</p>
          </div>
        )}
      </div>
      <div className="h-[280px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ROW 1: USER BREAKDOWNS (Focused on residency and staff roles) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title="Student Residency" 
          icon={GraduationCap}
          total={data.studentStats.reduce((acc, curr) => acc + curr.value, 0)}
        >
          <PieChart>
            <Pie
              data={data.studentStats}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={10}
              dataKey="value"
              stroke="none"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.studentStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
            <Legend verticalAlign="bottom" align="center" iconType="diamond" />
          </PieChart>
        </ChartCard>

        <ChartCard 
          title="Staff Role Hierarchy" 
          icon={UserCheck}
          total={data.staffStats.reduce((acc, curr) => acc + curr.value, 0)}
        >
          <PieChart>
            <Pie
              data={data.staffStats}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={10}
              dataKey="value"
              stroke="none"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.staffStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
            <Legend verticalAlign="bottom" align="center" iconType="diamond" />
          </PieChart>
        </ChartCard>
      </div>

      {/* ROW 2: DEPARTMENT & STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Departmental Throughput" icon={Layers}>
          <BarChart data={data.departmentStats} layout="vertical" margin={{ left: 40, right: 30 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontWeight: 900, textTransform: 'uppercase' }}
            />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
              {data.departmentStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Approval Lifecycle" icon={ShieldCheck}>
          <BarChart data={data.statusStats} margin={{ top: 20 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 900 }} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
              {data.statusStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </div>

      {/* ROW 3: TYPES & TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ChartCard title="Request Categories" icon={Package}>
             <PieChart>
              <Pie
                data={data.typeStats}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={60}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.typeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard 
            title="Request Volume Trend" 
            icon={TrendingUp}
            extra={
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button 
                  onClick={() => setTrendView('weekly')}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${trendView === 'weekly' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setTrendView('monthly')}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${trendView === 'monthly' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Monthly
                </button>
              </div>
            }
          >
            <AreaChart data={trendView === 'weekly' ? data.weeklyTrend : data.monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 800 }} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
