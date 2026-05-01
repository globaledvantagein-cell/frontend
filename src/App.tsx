import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import Home from './pages/Home';
import CompanyDirectory from './pages/CompanyDirectory';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Legal from './pages/Legal';

import ReviewQueue from './pages/ReviewQueue';
import AdminCompanies from './pages/AdminCompanies';
import AddJob from './pages/AddJob';
import RejectedJobs from './pages/RejectedJobs';
import AdminDashboard from './pages/AdminDashboard';
import JobTestLogs from './pages/JobTestLogs';
import AdminFeedback from './pages/AdminFeedback';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
// Profile feature flag — false by default, set to "true" in .env to enable.
const PROFILE_ENABLED = import.meta.env.VITE_ENABLE_PROFILE === 'true';

if (!GOOGLE_CLIENT_ID) {
  console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will not work.');
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="directory" element={<CompanyDirectory />} />
              <Route path="jobs" element={<Dashboard />} />
              <Route path="login" element={<Login />} />

              {/* Weekly job alerts — separate from auth. NOT a signup. */}
              <Route path="alerts" element={<Alerts />} />
              {/* Old /signup URL → redirect so existing links still work */}
              <Route path="signup" element={<Navigate to="/alerts" replace />} />

              <Route path="legal" element={<Legal />} />

              {/* Profile — gated behind VITE_ENABLE_PROFILE */}
              {PROFILE_ENABLED && (
                <Route element={<ProtectedRoute />}>
                  <Route path="profile" element={<Profile />} />
                </Route>
              )}

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
    </GoogleOAuthProvider>
  );
}