import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import Home from './pages/Home';
import CompanyDirectory from './pages/CompanyDirectory';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Legal from './pages/Legal';

import ReviewQueue from './pages/ReviewQueue';
import AdminCompanies from './pages/AdminCompanies';
import AddJob from './pages/AddJob';
import RejectedJobs from './pages/RejectedJobs';
import AdminDashboard from './pages/AdminDashboard';
import JobTestLogs from './pages/JobTestLogs';
import AdminFeedback from './pages/AdminFeedback';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="directory" element={<CompanyDirectory />} />
            <Route path="jobs" element={<Dashboard />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="legal" element={<Legal />} />
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="review" element={<ReviewQueue />} />
              <Route path="admin/companies" element={<AdminCompanies />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="add" element={<AddJob />} />
              <Route path="rejected" element={<RejectedJobs />} />
              <Route path="test-logs" element={<JobTestLogs />} />
              <Route path="feedback" element={<AdminFeedback />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
