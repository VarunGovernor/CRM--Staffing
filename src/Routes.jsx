import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// Public Pages (lazy loaded)
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Services = lazy(() => import('./pages/public/Services'));
const Industries = lazy(() => import('./pages/public/Industries'));
const Contact = lazy(() => import('./pages/public/Contact'));
const LoginPage = lazy(() => import('./pages/login'));
const SignupPage = lazy(() => import('./pages/signup'));
const NotFound = lazy(() => import('pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// CRM Pages (lazy loaded)
const Dashboard = lazy(() => import('./pages/dashboard'));
const Candidates = lazy(() => import('./pages/candidates'));
const Submissions = lazy(() => import('./pages/submissions'));
const Interviews = lazy(() => import('./pages/interviews'));
const Placements = lazy(() => import('./pages/placements'));
const HROnboarding = lazy(() => import('./pages/hr-onboarding'));
const Invoices = lazy(() => import('./pages/invoices'));
const Compliance = lazy(() => import('./pages/compliance'));
const Analytics = lazy(() => import('./pages/analytics'));
const Settings = lazy(() => import('./pages/settings'));
const IntegrationsPage = lazy(() => import('./pages/integrations'));
const BillingPage = lazy(() => import('./pages/billing'));
const DealsPage = lazy(() => import('./pages/deals'));
const ContactsPage = lazy(() => import('./pages/contacts'));
const EmailsPage = lazy(() => import('./pages/emails'));
const AccountsPage = lazy(() => import('./pages/accounts'));
const Pipeline = lazy(() => import('./pages/pipeline'));
const CandidatePipeline = lazy(() => import('./pages/candidate-pipeline'));
const PayrollPage = lazy(() => import('./pages/payroll'));
const Reports = lazy(() => import('./pages/reports'));
const Activities = lazy(() => import('./pages/activities'));

// User Menu Pages (lazy loaded)
const ProfileSettings = lazy(() => import('./pages/profile'));
const AccountSettings = lazy(() => import('./pages/account-settings'));

// Admin Pages (lazy loaded)
const AdminActivity = lazy(() => import('./pages/admin-activity'));
const AdminUsers = lazy(() => import('./pages/admin/users'));
const PendingApproval = lazy(() => import('./pages/pending-approval'));

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
      <RouterRoutes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* User Menu Routes - Profile, Account Settings, Billing */}
        <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
        <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
        <Route path="/settings/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />

        {/* Protected CRM Routes - Access controlled by permissions.js */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
        <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
        <Route path="/placements" element={<ProtectedRoute><Placements /></ProtectedRoute>} />
        <Route path="/hr-onboarding" element={<ProtectedRoute><HROnboarding /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
        <Route path="/deals" element={<ProtectedRoute><DealsPage /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
        <Route path="/emails" element={<ProtectedRoute><EmailsPage /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute module="pipeline"><Pipeline /></ProtectedRoute>} />
        <Route path="/candidate-pipeline" element={<ProtectedRoute><CandidatePipeline /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute><PayrollPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute><Activities /></ProtectedRoute>} />

        {/* Pending approval — protected (needs auth) but no approval check */}
        <Route path="/pending-approval" element={<ProtectedRoute skipApprovalCheck><PendingApproval /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/activity" element={<ProtectedRoute><AdminActivity /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute module="admin-users"><AdminUsers /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
