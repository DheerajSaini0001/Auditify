import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import Homepage from "./Pages/LandingPage";
import AboutPage from "./Pages/AboutPage";
import BulkAudit from "./Pages/BulkAudit";
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
import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./Component/ProtectedRoute.jsx";
import { Toaster } from 'react-hot-toast';

import MainLayout from "./Component/MainLayout";
import AIChatWidget from "./Component/AIChatWidget";

import ReportRestrictionWrapper from "./Component/ReportRestrictionWrapper.jsx";
import GuestReportPage from "./Component/GuestReportPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useData } from "./context/DataContext.jsx";

/**
 * Wraps a report route for unauthenticated users:
 * - If there IS audit data in context → render the real page
 *   (ReportRestrictionWrapper inside it will show the blurred gate)
 * - If there is NO data → show GuestReportPage (placeholder + lock card)
 */
const GuestRouteWrapper = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { data } = useData();

  if (isLoading) return null; // Wait silently for auth resolution

  // Not logged in but data exists → show real page (inner restriction handles gating)
  if (!isAuthenticated && data) return children;

  // Not logged in and no data → show placeholder gate page
  if (!isAuthenticated) return <GuestReportPage />;

  return children;
};

function AppContentInner() {
  const { theme } = useContext(ThemeContext);

  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route path="/dashboard/add-website" element={<AddWebsitePage />} />
          
          <Route path="/bulk-audit" element={<BulkAudit />} />

          <Route path="/bulk-audit/:id" element={<BulkAudit />} />
          
          <Route path="/report" element={<ReportLayout />} />
          <Route path="/report/:id" element={<ReportLayout />} />

          {/* Individual Report Pages - Gated for unauthenticated users */}
          <Route path="/technical-performance" element={<GuestRouteWrapper><Technical_Performance /></GuestRouteWrapper>} />
          <Route path="/on-page-seo" element={<GuestRouteWrapper><On_Page_SEO /></GuestRouteWrapper>} />
          <Route path="/accessibility" element={<GuestRouteWrapper><Accessibility /></GuestRouteWrapper>} />
          <Route path="/ux-content-structure" element={<GuestRouteWrapper><UX_Content_Structure /></GuestRouteWrapper>} />
          <Route path="/security-compliance" element={<GuestRouteWrapper><Security_Compilance /></GuestRouteWrapper>} />
          <Route path="/conversion-lead-flow" element={<GuestRouteWrapper><Conversion_Lead_Flow /></GuestRouteWrapper>} />
          <Route path="/aio" element={<GuestRouteWrapper><AIO /></GuestRouteWrapper>} />

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
    </>
  );
}

export default function AppContent() {
  return (
    <AppContentInner />
  );
}