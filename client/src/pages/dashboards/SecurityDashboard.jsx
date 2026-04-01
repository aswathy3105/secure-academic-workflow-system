import { useState, useEffect } from 'react';
import api from '../../services/api';
import DashboardShell from './DashboardShell';
import { ShieldCheck, UserCheck, Clock, FileCheck } from 'lucide-react';

const SecurityDashboard = () => {
  const [statsData, setStatsData] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const [statsRes, reqRes] = await Promise.all([
          api.get('/requests/stats'),
          api.get('/requests?limit=5')
        ]);
        
        // Transform stats for security view
        setStatsData([
          { label: 'Total Logs', value: statsRes.data.total, icon: ShieldCheck },
          { label: 'Approved Entry', value: statsRes.data.approved, icon: UserCheck },
          { label: 'Pending Clear', value: statsRes.data.pending, icon: Clock },
          { label: 'Total Verified', value: statsRes.data.approved + statsRes.data.rejected, icon: FileCheck },
        ]);

        const items = reqRes.data.map(req => ({
          id: req.requesterId,
          type: req.requestType,
          status: req.status,
          date: new Date(req.submittedDate).toLocaleDateString()
        }));
        setRecentRequests(items);
      } catch (error) {
        console.error('Error fetching security data');
      } finally {
        setLoading(false);
      }
    };
    fetchSecurityData();
  }, []);

  return <DashboardShell title="Security Gate Operations" icon={ShieldCheck} stats={statsData} recentItems={recentRequests} loading={loading} />;
};

export default SecurityDashboard;
