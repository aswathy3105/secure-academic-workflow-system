import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import HODDashboard from './pages/dashboards/HODDashboard';
import SecurityDashboard from './pages/dashboards/SecurityDashboard';
import HostelSecurityDashboard from './pages/dashboards/HostelSecurityDashboard';
import MainGateSecurityDashboard from './pages/dashboards/MainGateSecurityDashboard';
import Sidebar from './components/Sidebar';
import AddUser from './pages/dashboards/AddUser';
import ManageUsers from './pages/dashboards/ManageUsers';
import AllRequests from './pages/dashboards/AllRequests';
import AddRequest from './pages/dashboards/AddRequest';
import MyRequest from './pages/dashboards/MyRequest';
import Profile from './pages/dashboards/Profile';
import AddStaffRequest from './pages/dashboards/AddStaffRequest';
import MyStaffRequest from './pages/dashboards/MyStaffRequest';
import AllRequest from './pages/dashboards/AllRequest';

import { useAuth } from './context/AuthContext';

const SecurityDashboardRouter = () => {
  const { user } = useAuth();
  if (user?.securityType === 'Main Gate') return <MainGateSecurityDashboard />;
  return <HostelSecurityDashboard />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex h-screen overflow-hidden bg-slate-950">
          <Sidebar />
          <div className="flex-grow flex flex-col overflow-hidden relative">
            <main className="flex-grow overflow-auto">
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Dashboards */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users/add" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AddUser />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users/manage" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageUsers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/requests" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AllRequests />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/mentor/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/warden/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['staff']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student/requests/add" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <AddRequest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student/requests/my" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyRequest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/student/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staff/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'hod']}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staff/requests/add" 
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'hod']}>
                      <AddStaffRequest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staff/requests/my" 
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'hod']}>
                      <MyStaffRequest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staff/requests/all" 
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'hod']}>
                      <AllRequest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/staff/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['staff', 'hod']}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/hod/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <HODDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/hod/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['hod']}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/security/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['security']}>
                      <SecurityDashboardRouter />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/security/profile" 
                  element={
                    <ProtectedRoute allowedRoles={['security']}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />

                {/* Home Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Toaster position="top-right" />
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
