import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import Unauthorized from './pages/Unauthorized';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Industries from './pages/public/Industries';
import Contact from './pages/public/Contact';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';

// CRM Pages
import Dashboard from './pages/dashboard';
import Candidates from './pages/candidates';
import Submissions from './pages/submissions';
import Interviews from './pages/interviews';
import Placements from './pages/placements';
import HROnboarding from './pages/hr-onboarding';
import Invoices from './pages/invoices';
import Compliance from './pages/compliance';
import Analytics from './pages/analytics';
import Settings from './pages/settings';
import IntegrationsPage from './pages/integrations';
import BillingPage from './pages/billing';
import DealsPage from './pages/deals';
import ContactsPage from './pages/contacts';
import EmailsPage from './pages/emails';
import AccountsPage from './pages/accounts';
import Pipeline from './pages/pipeline';
import CandidatePipeline from './pages/candidate-pipeline';
import PayrollPage from './pages/payroll';
import Reports from './pages/reports';
import Activities from './pages/activities';

// User Menu Pages
import ProfileSettings from './pages/profile';
import AccountSettings from './pages/account-settings';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
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

        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
