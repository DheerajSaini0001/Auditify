import React, { useContext } from "react";
import { Routes, Route, useParams } from "react-router-dom";

import Homepage from "./Pages/LandingPage";
import AboutPage from "./Pages/AboutPage";
import Technical_Performance from "./Pages/Technical_Performance";
import On_Page_SEO from "./Pages/On_Page_SEO";
import Accessibility from "./Pages/Accessibility";
import UX_Content_Structure from "./Pages/UX_Content_Structure";
import Conversion_Lead_Flow from "./Pages/Conversion_Lead_Flow";
import Security_Compilance from "./Pages/Security_Compilance";
import AIO from "./Pages/AIO";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import OtpVerifyPage from "./Pages/OtpVerifyPage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage";
import ResetPasswordPage from "./Pages/ResetPasswordPage";
import AuthCallbackPage from "./Pages/AuthCallbackPage";
import DashboardPage from "./Pages/DashboardPage";
import AddWebsitePage from "./Pages/AddWebsitePage";
import AdminDashboard from "./Pages/AdminDashboard";
import AdminConfig from "./Pages/AdminConfig";
import ReportLayout from "./Pages/ReportLayout.jsx";
import NotFound from "./Pages/NotFound.jsx";
import DocsPage from "./Pages/DocsPage";
import HelpCenterPage from "./Pages/HelpCenterPage";
import PrivacyPolicyPage from "./Pages/PrivacyPolicyPage";
import TermsOfServicePage from "./Pages/TermsOfServicePage";
import CookiesPolicyPage from "./Pages/CookiesPolicyPage";
import ServicesPage from "./Pages/ServicesPage";
import ContactPage from "./Pages/ContactPage";
import DoNotSellInfoPage from "./Pages/DoNotSellInfoPage";
import AuditHistoryPage from "./Pages/AuditHistoryPage";

import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./Component/ProtectedRoute.jsx";
import { Toaster } from 'react-hot-toast';

import MainLayout from "./Component/MainLayout";
import AIChatWidget from "./Component/AIChatWidget";
import AIChatOverlay from "./Component/AIChatOverlay";

import ReportRestrictionWrapper from "./Component/ReportRestrictionWrapper.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useData } from "./context/DataContext.jsx";
import CanonicalTag from "./Component/CanonicalTag.jsx";
import GuestRoute from "./Component/GuestRoute";

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

          <Route path="/audit-history" element={<AuditHistoryPage />} />


          <Route path="/report" element={<ReportLayout />} />
          <Route path="/report/:id" element={<ReportLayout />} />

          {/* Individual Report Pages - open to everyone, guests included */}
          <Route path="/technical-performance/:id?" element={<GuestRouteWrapper><Technical_Performance /></GuestRouteWrapper>} />
          <Route path="/on-page-seo/:id?" element={<GuestRouteWrapper><On_Page_SEO /></GuestRouteWrapper>} />
          <Route path="/accessibility/:id?" element={<GuestRouteWrapper><Accessibility /></GuestRouteWrapper>} />
          <Route path="/ux-content-structure/:id?" element={<GuestRouteWrapper><UX_Content_Structure /></GuestRouteWrapper>} />
          <Route path="/security-compliance/:id?" element={<GuestRouteWrapper><Security_Compilance /></GuestRouteWrapper>} />
          <Route path="/conversion-lead-flow/:id?" element={<GuestRouteWrapper><Conversion_Lead_Flow /></GuestRouteWrapper>} />
          <Route path="/aio/:id?" element={<GuestRouteWrapper><AIO /></GuestRouteWrapper>} />

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