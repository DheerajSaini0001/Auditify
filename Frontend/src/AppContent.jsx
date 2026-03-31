import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";

import Homepage from "./Pages/Homepage";
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
import ReportLayout from "./Pages/ReportLayout.jsx";
import NotFound from "./Pages/NotFound.jsx";
import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./Component/ProtectedRoute.jsx";

import MainLayout from "./Component/MainLayout";
import AIChatWidget from "./Component/AIChatWidget";

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
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/add-website" element={
            <ProtectedRoute>
              <AddWebsitePage />
            </ProtectedRoute>
          } />
          
          <Route path="/bulk-audit" element={
            <ProtectedRoute>
              <BulkAudit />
            </ProtectedRoute>
          } />

          <Route path="/bulk-audit/:id" element={
            <ProtectedRoute>
              <BulkAudit />
            </ProtectedRoute>
          } />
          
          <Route path="/report" element={<ReportLayout />} />
          <Route path="/report/:id" element={<ReportLayout />} />

          {/* Individual Report Pages - Publicly accessible for viewing the audit */}
          <Route path="/technical-performance" element={<Technical_Performance />} />
          <Route path="/on-page-seo" element={<On_Page_SEO />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/ux-content-structure" element={<UX_Content_Structure />} />
          <Route path="/security-compliance" element={<Security_Compilance />} />
          <Route path="/conversion-lead-flow" element={<Conversion_Lead_Flow />} />
          <Route path="/aio" element={<AIO />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <AIChatWidget />
    </>
  );
}

export default function AppContent() {
  return (
    <AppContentInner />
  );
}