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
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import UserDashboard from "./Pages/UserDashboard";
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
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

          {/* Individual Report Pages - Keeping Protected for now as they are detailed, but can be changed if user asks */}
          <Route path="/technical-performance" element={<ProtectedRoute><Technical_Performance /></ProtectedRoute>} />
          <Route path="/on-page-seo" element={<ProtectedRoute><On_Page_SEO /></ProtectedRoute>} />
          <Route path="/accessibility" element={<ProtectedRoute><Accessibility /></ProtectedRoute>} />
          <Route path="/ux-content-structure" element={<ProtectedRoute><UX_Content_Structure /></ProtectedRoute>} />
          <Route path="/security-compliance" element={<ProtectedRoute><Security_Compilance /></ProtectedRoute>} />
          <Route path="/conversion-lead-flow" element={<ProtectedRoute><Conversion_Lead_Flow /></ProtectedRoute>} />
          <Route path="/aio" element={<ProtectedRoute><AIO /></ProtectedRoute>} />

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