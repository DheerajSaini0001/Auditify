import React, { useContext } from "react";
import { Routes, Route, useParams } from "react-router-dom";

import Homepage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import Technical_Performance from "./pages/Technical_Performance";
import On_Page_SEO from "./pages/On_Page_SEO";
import Accessibility from "./pages/Accessibility";
import UX_Content_Structure from "./pages/UX_Content_Structure";
import Conversion_Lead_Flow from "./pages/Conversion_Lead_Flow";
import Security_Compilance from "./pages/Security_Compilance";
import AIO from "./pages/AIO";
import AEO from "./pages/AEO";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import AddWebsitePage from "./pages/AddWebsitePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminConfig from "./pages/AdminConfig";
import ReportLayout from "./pages/ReportLayout.jsx";
import AuditSummaryPage from "./pages/AuditSummaryPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import DocsPage from "./pages/DocsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import CookiesPolicyPage from "./pages/CookiesPolicyPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import DoNotSellInfoPage from "./pages/DoNotSellInfoPage";
import AuditHistoryPage from "./pages/AuditHistoryPage";

import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SectionNavFooter from "./components/SectionNavFooter.jsx";
import { Toaster } from 'react-hot-toast';

import MainLayout from "./components/MainLayout";
import AIChatWidget from "./components/AIChatWidget";
import AIChatOverlay from "./components/AIChatOverlay";

import ReportRestrictionWrapper from "./components/ReportRestrictionWrapper.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useData } from "./context/DataContext.jsx";
import CanonicalTag from "./components/CanonicalTag.jsx";
import GuestRoute from "./components/GuestRoute";
import SeoDashboard from "./pages/SeoDashboard.jsx";

/**
 * Wraps a report route. Reports are open to everyone — guests included, with no
 * auth lock. On a fresh load / refresh it restores the report by fetching the id
 * from the URL; the report page renders its own loading shimmer until that lands.
 */
const GuestRouteWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { data, fetchSingleReport } = useData();
  const { id } = useParams();
  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    // If we have an ID in URL but no data (or mismatch), fetch it to restore state on refresh
    if (id && (!data || data._id !== id)) {
      setIsFetching(true);
      fetchSingleReport(id).finally(() => setIsFetching(false));
    }
  }, [id, data, fetchSingleReport]);

  if (isLoading || isFetching) return null; // Wait silently for auth resolution

  // Reports are open to everyone — guests included. No auth lock. The report pages
  // render their own loading shimmer until the data fetched above arrives.
  return children;
};

function AppContentInner() {
  const { theme } = useContext(ThemeContext);

  return (
    <>
      <CanonicalTag />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<GuestRoute><Homepage /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/verify-otp" element={<GuestRoute><OtpVerifyPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Footer Pages */}
          <Route path="/documentation" element={<DocsPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/cookies" element={<CookiesPolicyPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/do-not-sell" element={<DoNotSellInfoPage />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/add-website" element={<AddWebsitePage />} />

          {/* SEO management for CMS pages — edits CmsContentEntry.seo, not the audit pipeline.
              super_admin only, matching the sidebar entry and the API guard. */}
          <Route path="/seo" element={
            <ProtectedRoute requiredRole="super_admin">
              <SeoDashboard />
            </ProtectedRoute>
          } />

          <Route path="/audit-history" element={<AuditHistoryPage />} />

          <Route path="/report" element={<ReportLayout />} />
          <Route path="/report/:id" element={<ReportLayout />} />

          {/* Intermediate multi-page audit summary + page-type heatmap (open to all) */}
          <Route path="/audit-summary" element={<AuditSummaryPage />} />

          {/* Individual Report Pages - open to everyone, guests included */}
          <Route path="/technical-performance/:id?" element={<GuestRouteWrapper><Technical_Performance /><SectionNavFooter currentKey="technicalPerformance" /></GuestRouteWrapper>} />
          <Route path="/on-page-seo/:id?" element={<GuestRouteWrapper><On_Page_SEO /><SectionNavFooter currentKey="onPageSEO" /></GuestRouteWrapper>} />
          <Route path="/accessibility/:id?" element={<GuestRouteWrapper><Accessibility /><SectionNavFooter currentKey="accessibility" /></GuestRouteWrapper>} />
          <Route path="/ux-content-structure/:id?" element={<GuestRouteWrapper><UX_Content_Structure /><SectionNavFooter currentKey="UXOrContentStructure" /></GuestRouteWrapper>} />
          <Route path="/security-compliance/:id?" element={<GuestRouteWrapper><Security_Compilance /><SectionNavFooter currentKey="securityOrCompliance" /></GuestRouteWrapper>} />
          <Route path="/conversion-lead-flow/:id?" element={<GuestRouteWrapper><Conversion_Lead_Flow /><SectionNavFooter currentKey="conversionAndLeadFlow" /></GuestRouteWrapper>} />
          <Route path="/aio/:id?" element={<GuestRouteWrapper><AIO /><SectionNavFooter currentKey="aioReadiness" /></GuestRouteWrapper>} />
          <Route path="/aeo/:id?" element={<GuestRouteWrapper><AEO /><SectionNavFooter currentKey="aeo" /></GuestRouteWrapper>} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/setup" element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminConfig />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster position="top-right" reverseOrder={false} />
      <AIChatWidget />
      <AIChatOverlay />
    </>
  );
}

export default function AppContent() {
  return (
    <AppContentInner />
  );
}