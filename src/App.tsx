import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AppliedJobsProvider } from './context/AppliedJobsContext';
import { SavedJobsProvider } from './context/SavedJobsContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import Home from './pages/Home';

// Pages used by anonymous browsers are loaded eagerly. Everything else is
// code-split so the public bundle stays small.
const CompanyDirectory = lazy(() => import('./pages/CompanyDirectory'));
const JobSharePage     = lazy(() => import('./pages/JobSharePage'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const AppliedJobs      = lazy(() => import('./pages/AppliedJobs'));
const Login            = lazy(() => import('./pages/Login'));
const Alerts           = lazy(() => import('./pages/Alerts'));
const Profile          = lazy(() => import('./pages/Profile'));
const Legal            = lazy(() => import('./pages/Legal'));

// Admin pages — never loaded for regular users
const ReviewQueue     = lazy(() => import('./pages/ReviewQueue'));
const AdminCompanies  = lazy(() => import('./pages/AdminCompanies'));
const AddJob          = lazy(() => import('./pages/AddJob'));
const RejectedJobs    = lazy(() => import('./pages/RejectedJobs'));
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const JobTestLogs     = lazy(() => import('./pages/JobTestLogs'));
const AdminFeedback   = lazy(() => import('./pages/AdminFeedback'));
const ResumeMatcher   = lazy(() => import('./pages/SmartMatch'));
const TodayMatches    = lazy(() => import('./pages/TodayMatches'));
const CareerGuideAdmin = lazy(() => import('./pages/CareerGuideAdmin'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const PROFILE_ENABLED  = import.meta.env.VITE_ENABLE_PROFILE === 'true';

if (!GOOGLE_CLIENT_ID) {
  console.warn('[App] VITE_GOOGLE_CLIENT_ID is not set — Google login will not work.');
}

function RouteFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div className="skeleton" style={{ width: '60%', maxWidth: 600, height: 24, borderRadius: 6 }} />
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <AppliedJobsProvider>
          <SavedJobsProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="directory" element={<CompanyDirectory />} />
                <Route path="jobs/:id" element={<JobSharePage />} />
                <Route path="jobs"      element={<Dashboard />} />
                <Route path="applied"   element={<AppliedJobs />} />
                <Route path="login"     element={<Login />} />

                {/* Weekly job alerts — separate from auth. NOT a signup. */}
                <Route path="alerts" element={<Alerts />} />
                {/* Legacy /signup → redirect */}
                <Route path="signup" element={<Navigate to="/alerts" replace />} />

                <Route path="legal" element={<Legal />} />

                {/* Profile — gated behind VITE_ENABLE_PROFILE */}
                {PROFILE_ENABLED && (
                  <Route element={<ProtectedRoute />}>
                    <Route path="profile" element={<Profile />} />
                    <Route path="today-matches" element={<TodayMatches />} />
                  </Route>
                )}

                <Route element={<ProtectedRoute requireAdmin={true} />}>
                  <Route path="review"           element={<ReviewQueue />} />
                  <Route path="admin/companies"  element={<AdminCompanies />} />
                  <Route path="admin/career-guide" element={<CareerGuideAdmin />} />
                  <Route path="dashboard"        element={<AdminDashboard />} />
                  <Route path="add"              element={<AddJob />} />
                  <Route path="rejected"         element={<RejectedJobs />} />
                  <Route path="test-logs"        element={<JobTestLogs />} />
                  <Route path="feedback"         element={<AdminFeedback />} />
                  <Route path="resume-match"     element={<ResumeMatcher />} />
                  <Route path="smart-match"      element={<ResumeMatcher />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </SavedJobsProvider>
          </AppliedJobsProvider>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}