import React, { useContext, useEffect, useRef } from "react";
import { Routes, Route, useParams, useLocation } from "react-router-dom";

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
import { trackEvent, trackHeartbeat, trackSessionEnd } from "./utils/tracking.js";

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
    if (!id) return;

    // A guest's copy of a report has the gated sections stripped by the server and
    // flagged `locked`. After signing in, that copy is not merely stale — it is
    // missing the very content they signed in to read, so the blur would lift to
    // reveal an empty panel. The data says which copy it is, so ask it rather than
    // trying to track auth transitions across mounts.
    const holdsGatedCopy =
      !!data &&
      Object.values(data).some((v) => v && typeof v === "object" && v.locked === true);

    const needsFetch = !data || data._id !== id || (isAuthenticated && holdsGatedCopy);
    if (!needsFetch) return;

    setIsFetching(true);
    fetchSingleReport(id).finally(() => setIsFetching(false));
  }, [id, data, isAuthenticated, fetchSingleReport]);

  if (isLoading || isFetching) return null; // Wait silently for auth resolution

  // Reports are open to everyone — guests included. No auth lock. The report pages
  // render their own loading shimmer until the data fetched above arrives.
  return children;
};

/**
 * Session-lifecycle tracking for the whole app.
 *
 * Three signals, each recorded where it is actually observable:
 *  • a page view per route change (this is an SPA — the server sees exactly one
 *    document request per visit, so every navigation after the first is invisible
 *    to it);
 *  • a periodic heartbeat, so a session that is genuinely still open is not swept
 *    closed by the 30-minute idle rule;
 *  • a SESSION_END beacon on pagehide.
 *
 * `pagehide` rather than `beforeunload`: Safari (and mobile browsers generally)
 * do not reliably fire beforeunload, and a tab restored from the back/forward
 * cache never fires unload at all. pagehide is the event that actually fires on
 * both, which is why it is the one the beacon is hung off.
 */
const HEARTBEAT_MS = 5 * 60 * 1000; // well inside the 30-minute idle window

const useSessionTracking = () => {
  const location = useLocation();
  const endedRef = useRef(false);

  // One PAGE_VIEW per route change, including the first render.
  useEffect(() => {
    trackEvent('PAGE_VIEW', { url: location.pathname + location.search });
  }, [location.pathname, location.search]);

  useEffect(() => {
    trackHeartbeat();
    const timer = setInterval(trackHeartbeat, HEARTBEAT_MS);

    const handleHide = () => {
      // Guarded: pagehide can fire more than once (bfcache, tab switching on
      // mobile), and a second beacon would move the session's recorded end time
      // later than the moment the visitor actually left.
      if (endedRef.current) return;
      endedRef.current = true;
      trackSessionEnd(window.location.pathname);
    };

    window.addEventListener('pagehide', handleHide);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', handleHide);
    };
  }, []);
};

function AppContentInner() {
  const { theme } = useContext(ThemeContext);
  useSessionTracking();

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

          {/* Intermediate multi-page audit summary + page-type heatmap (open to all).
              The `:id` form is the run's ROOT report — the summary is then rebuilt from
              the report itself, so it survives a new tab, a refresh, a shared link, and
              an admin opening someone else's audit from Journeys. The bare form is the
              live batch flow, which still hands its page list over in router state. */}
          <Route path="/audit-summary" element={<AuditSummaryPage />} />
          <Route path="/audit-summary/:id" element={<AuditSummaryPage />} />

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