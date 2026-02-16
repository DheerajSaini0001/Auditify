import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Search, FileText, Link, Image as ImageIcon, Video,
  Layout, FileCode, Lock, Copy, List, Tag, Globe,
  CheckCircle, AlertTriangle, XCircle, Info, Loader2, ArrowRight
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";

const seoMetricExplanations = InfoDetails;

// ------------------------------------------------------
// ✅ Score Calculation Info (Standard Weights)
// ------------------------------------------------------
const scoreCalculationInfo = InfoDetails.On_Page_SEO_Methodology;

// ------------------------------------------------------
// ✅ Simple Skeleton
// ------------------------------------------------------
// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

const SeoShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"}`}>
        {/* Icon Container (Circle) */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"}`}>
          <div className="animate-pulse">
            {React.cloneElement(step.icon, {
              className: "w-8 h-8",
              strokeWidth: 2.5
            })}
          </div>
        </div>

        {/* Title */}
        <h2 className={`mt-6 text-2xl font-bold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"}`}>
          {step.title}
        </h2>

        {/* Description */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {step.text}
        </p>

        {/* Processing State */}
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Processing</span>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-6 bg-blue-500/40" : "w-2 bg-slate-400/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Metric Card (Security Style)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, value, unit, darkMode, icon: Icon, children, className, onInfo }) => {
  const displayScore = score !== undefined && score !== null ? (score > 1 ? 100 : Math.round(score * 100)) : 0;
  const isPassed = displayScore >= 90;
  const isWarning = displayScore >= 50 && displayScore < 90;

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = "text-red-600 bg-red-50 border-red-100";
  let statusText = "Failed";

  if (darkMode) {
    statusColor = "text-red-400 bg-red-900/20 border-red-800/30";
  }

  if (isPassed) {
    statusColor = darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100";
    statusText = "Passed";
  } else if (isWarning) {
    statusColor = darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100";
    statusText = "Warning";
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group ${className || ""}`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusText}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={`text-lg font-black ${isPassed ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500"}`}>
              {value || "--"} <span className="text-sm font-semibold text-gray-400">{unit}</span>
            </div>
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo();
                }}
                className={`mt-1 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {description}
          </p>
        </div>

        {/* Technical Data / Children */}
        {children && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              {children}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// ------------------------------------------------------
// ✅ Simple Section
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode, gridClasses = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className={`grid ${gridClasses} gap-4`}>
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Specialized Title Tag Card
// ------------------------------------------------------
const TitleTagCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100");

  const statusText = isPassed ? "Optimized" : "Needs Improvement";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Tag size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Title Tag</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.length || 0} characters)
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* The Title Itself */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Current Title
            </h4>
            <div className={`p-3 rounded-lg border font-serif text-lg leading-snug ${darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
              {meta.title || <span className="italic opacity-50">No title found</span>}
            </div>
          </div>

          {/* Analysis Details (Only if we have the new metadata format) */}
          {meta.why_this_occurred && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.why_this_occurred}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.how_to_fix}
                </p>
              </div>
            </div>
          )}

          {/* Best Practices (Optional footer) */}
          {meta.seo_best_practices && (
            <div className={`mt-2 p-2 rounded text-xs opacity-70 flex items-start gap-2 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{meta.seo_best_practices}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Specialized Meta Description Card
// ------------------------------------------------------
const MetaDescriptionCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100");

  const statusText = isPassed ? "Optimized" : "Needs Improvement";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <FileText size={24} className={darkMode ? "text-purple-400" : "text-purple-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Meta Description</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.length || 0} characters)
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* The Description Itself */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Current Description
            </h4>
            <div className={`p-3 rounded-lg border font-serif text-sm leading-relaxed ${darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
              {meta.description || <span className="italic opacity-50">No meta description found</span>}
            </div>
          </div>

          {/* Analysis Details */}
          {meta.why_this_occurred && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.why_this_occurred}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.how_to_fix}
                </p>
              </div>
            </div>
          )}

          {/* Best Practices (Optional footer) */}
          {meta.seo_best_practices && (
            <div className={`mt-2 p-2 rounded text-xs opacity-70 flex items-start gap-2 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{meta.seo_best_practices}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
// ------------------------------------------------------
// ✅ Specialized Canonical Tag Card
// ------------------------------------------------------
const CanonicalTagCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100");

  const statusText = isPassed ? "Optimized" : "Warning / Info";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Copy size={24} className={darkMode ? "text-pink-400" : "text-pink-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Canonical Tag</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                {meta.isSelfReferencing && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${darkMode ? "border-blue-500/30 text-blue-400 bg-blue-500/10" : "border-blue-200 text-blue-600 bg-blue-50"}`}>
                    Self-Referencing
                  </span>
                )}
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* The URL Itself */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Canonical URL
            </h4>
            <div className={`p-3 rounded-lg border font-mono text-xs break-all ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
              {meta.canonical || <span className="italic opacity-50">No canonical tag found</span>}
            </div>
          </div>

          {/* Analysis Details */}
          {meta.why_this_occurred && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.why_this_occurred}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.how_to_fix}
                </p>
              </div>
            </div>
          )}

          {/* Best Practices (Optional footer) */}
          {meta.seo_best_practices && (
            <div className={`mt-2 p-2 rounded text-xs opacity-70 flex items-start gap-2 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{meta.seo_best_practices}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Specialized URL Structure Card
// ------------------------------------------------------
const URLStructureCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100");

  const statusText = isPassed ? "Clean Details" : "Issues Found";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Link size={24} className={darkMode ? "text-cyan-400" : "text-cyan-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>URL Structure</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* The URL Itself */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Analyzed URL
            </h4>
            <div className={`p-3 rounded-lg border font-mono text-xs break-all ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
              {meta.url || <span className="italic opacity-50">No URL data</span>}
            </div>
          </div>

          {/* Analysis Details */}
          {meta.why_this_occurred && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.why_this_occurred}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.how_to_fix}
                </p>
              </div>
            </div>
          )}

          {/* Best Practices (Optional footer) */}
          {meta.seo_best_practices && (
            <div className={`mt-2 p-2 rounded text-xs opacity-70 flex items-start gap-2 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{meta.seo_best_practices}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Specialized H1 Tag Card
// ------------------------------------------------------
const H1TagCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100");

  const statusText = isPassed ? "Optimized" : "Attention Needed";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 md:col-span-2 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Layout size={24} className={darkMode ? "text-violet-400" : "text-violet-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>H1 Tag</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.count || 0} Found)
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* H1 Content Display */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              H1 Content
            </h4>
            <div className={`p-3 rounded-lg border leading-tight space-y-2 ${darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
              {meta.content && meta.content.length > 0 ? (
                meta.content.map((h, i) => (
                  <div key={i} className="font-serif text-lg">• {h}</div>
                ))
              ) : (
                <span className="italic opacity-50">No H1 tag found</span>
              )}
            </div>
          </div>

          {/* Analysis Details */}
          {meta.why_this_occurred && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.why_this_occurred}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.how_to_fix}
                </p>
              </div>
            </div>
          )}

          {/* Best Practices (Optional footer) */}
          {meta.seo_best_practices && (
            <div className={`mt-2 p-2 rounded text-xs opacity-70 flex items-start gap-2 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{meta.seo_best_practices}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Specialized Image Analysis Card
// ------------------------------------------------------
const ImageAnalysisCard = ({ data, darkMode, onInfo, baseUrl }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1; // Strict 100% for green

  const resolveLink = (src) => {
    if (!src) return "#";
    try {
      return new URL(src, baseUrl).href;
    } catch {
      return src;
    }
  };

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (score > 0.7
      ? (darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100")
      : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100")
    );

  const statusText = isPassed ? "Fully Optimized" : (score > 0.7 ? "Good / Improvements" : "Needs Attention");

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 md:col-span-2 lg:col-span-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <ImageIcon size={24} className={darkMode ? "text-pink-400" : "text-pink-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Image Optimization</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.total || 0} Total Images)
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            {/* 1. With Alt */}
            <div className={`p-2 rounded border ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{meta.withAlt || 0}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">With Alt</div>
            </div>

            {/* 2. Without Alt (New) */}
            <div className={`p-2 rounded border ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-lg font-bold ${meta.missingAlt?.length > 0 ? "text-red-500" : (darkMode ? "text-white" : "text-gray-900")}`}>
                {meta.missingAlt?.length || 0}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Without Alt</div>
            </div>

            {/* 3. Without Title */}
            <div className={`p-2 rounded border ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-lg font-bold ${meta.missingTitle?.length > 0 ? "text-amber-500" : (darkMode ? "text-white" : "text-gray-900")}`}>
                {meta.missingTitle?.length || 0}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Without Title</div>
            </div>

            {/* 4. Heavy Images */}
            <div className={`p-2 rounded border ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-lg font-bold ${meta.largeImages?.length > 0 ? "text-red-500" : (darkMode ? "text-white" : "text-gray-900")}`}>
                {meta.largeImages?.length || 0}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Heavy (&gt;150KB)</div>
            </div>
          </div>

          {/* Issues List (Clickable Links) */}
          {/* Issues List (Clickable Links) */}
          {(meta.missingAlt?.length > 0 || meta.missingTitle?.length > 0 || meta.largeImages?.length > 0) && (
            <div className="space-y-3">
              {/* 1. Missing Alt Text */}
              {meta.missingAlt?.length > 0 && (
                <div className={`text-xs p-3 rounded border border-red-500/20 bg-red-500/5`}>
                  <div className="font-bold text-red-500 mb-2 uppercase flex items-center gap-1">
                    <AlertTriangle size={10} /> Missing Alt Text ({meta.missingAlt.length})
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {meta.missingAlt.map((img, i) => (
                      <a
                        key={i}
                        href={resolveLink(img.src)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 overflow-hidden hover:underline group/link"
                        title={img.src}
                      >
                        <div className="truncate opacity-70 font-mono text-[10px] group-hover/link:opacity-100 group-hover/link:text-blue-500 transition-colors">
                          {img.src}
                        </div>
                        <Link size={8} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Missing Titles (Restored) */}
              {meta.missingTitle?.length > 0 && (
                <div className={`text-xs p-3 rounded border border-amber-500/20 bg-amber-500/5`}>
                  <div className="font-bold text-amber-500 mb-2 uppercase flex items-center gap-1">
                    <Info size={10} /> Missing Titles ({meta.missingTitle.length})
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {meta.missingTitle.map((img, i) => (
                      <a
                        key={i}
                        href={resolveLink(img.src)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 overflow-hidden hover:underline group/link"
                        title={img.src}
                      >
                        <div className="truncate opacity-70 font-mono text-[10px] group-hover/link:opacity-100 group-hover/link:text-blue-500 transition-colors">
                          {img.src}
                        </div>
                        <Link size={8} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Compression Issues */}
              {meta.largeImages?.length > 0 && (
                <div className={`text-xs p-3 rounded border border-amber-500/20 bg-amber-500/5`}>
                  <div className="font-bold text-amber-500 mb-2 uppercase flex items-center gap-1">
                    <AlertTriangle size={10} /> Compression Issues ({meta.largeImages.length} {">"} 150KB)
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {meta.largeImages.map((img, i) => (
                      <a
                        key={i}
                        href={resolveLink(img.src)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 hover:bg-black/5 dark:hover:bg-white/5 p-1 -mx-1 rounded transition-colors group/link"
                      >
                        <div className="truncate opacity-70 font-mono text-[10px] group-hover/link:text-blue-500">{img.src}</div>
                        <div className="font-bold whitespace-nowrap">{img.size} KB</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Details */}
          {meta.why_this_occurred && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.why_this_occurred}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {meta.how_to_fix}
                </p>
              </div>
            </div>
          )}

          {/* Best Practices (Optional footer) */}
          {meta.seo_best_practices && (
            <div className={`mt-2 p-2 rounded text-xs opacity-70 flex items-start gap-2 ${darkMode ? "bg-gray-900/50" : "bg-gray-50"}`}>
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>{meta.seo_best_practices}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
// ------------------------------------------------------
// ✅ Specialized Semantic Tags Card
// ------------------------------------------------------
const SemanticTagsCard = ({ data, darkMode, onInfo, className }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;

  // Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (score >= 0.7
      ? (darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100")
      : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100")
    );

  const statusText = isPassed ? "Excellent Structure" : (score >= 0.7 ? "Good Structure" : "Weak Structure");

  const renderTagBadge = (tag, isCore) => {
    const isPresent = meta[tag] === 1;
    return (
      <div key={tag} className={`flex items-center justify-between p-2 rounded border ${isPresent
        ? (darkMode ? "bg-green-900/20 border-green-800/30" : "bg-green-50 border-green-100")
        : (darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200")
        }`}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-green-500" : "bg-gray-400"}`} />
          <span className={`text-xs font-mono font-medium ${isPresent ? (darkMode ? "text-green-300" : "text-green-700") : "opacity-50"}`}>
            &lt;{tag}&gt;
          </span>
        </div>
        {isPresent ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="opacity-30" />}
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Layout size={24} className={darkMode ? "text-teal-400" : "text-teal-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Semantic Structure</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => { e.stopPropagation(); onInfo(); }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Tag Grid */}
        <div className="space-y-3">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Core Elements (Key for SEO)</div>
          <div className="grid grid-cols-2 gap-2">
            {["header", "nav", "main", "footer"].map(t => renderTagBadge(t, true))}
          </div>

          <div className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Content Elements</div>
          <div className="grid grid-cols-3 gap-2">
            {["article", "section", "aside"].map(t => renderTagBadge(t, false))}
          </div>
        </div>

        {/* Warnings / Potential Replacements */}
        {meta.potentialReplacements?.length > 0 && (
          <div className={`text-xs p-3 rounded border border-amber-500/20 bg-amber-500/5`}>
            <div className="font-bold text-amber-500 mb-2 uppercase flex items-center gap-1">
              <AlertTriangle size={10} /> Optimization Opportunity
            </div>
            <p className="opacity-80 mb-2">
              We detected divs that act like semantic tags. Converting these improves accessibility.
            </p>
            <div className="space-y-1">
              {meta.potentialReplacements.map((tag, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="opacity-50">&lt;div class="{tag}"&gt;</span>
                  <ArrowRight size={10} className="text-amber-500" />
                  <span className="font-bold text-amber-500">&lt;{tag}&gt;</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Details */}
        {meta.why_this_occurred && !isPassed && (
          <div className={`grid grid-cols-1 gap-2 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                <AlertTriangle size={12} />
                <span>Analysis</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {meta.why_this_occurred}
              </p>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                <CheckCircle size={12} />
                <span>Recommendation</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {meta.how_to_fix}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Specialized Contextual Analysis Card
// ------------------------------------------------------
const ContextualAnalysisCard = ({ data, linksData, darkMode, onInfo, resolveLink }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;

  // Logic from renderLinkList
  const isContextual = (text, href) => {
    if (!text || !href) return false;
    const normalizedText = text.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!normalizedText) return false;
    try {
      const urlObj = href.startsWith('http') ? new URL(href) : { pathname: href };
      const urlPath = urlObj.pathname || href;
      if (urlPath === "/" || urlPath === "") {
        return normalizedText.includes("home") || normalizedText.includes("index") || normalizedText.includes("main");
      }
      const cleanPath = urlPath.replace(/\.[^/.]+$/, "").replace(/\/$/, "");
      const slug = cleanPath.split('/').pop().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!slug) return false;
      return normalizedText.includes(slug) || slug.includes(normalizedText);
    } catch { return false; }
  };

  // Combine Internal & External Links for analysis
  const allLinks = [
    ...(linksData?.meta?.internalLinks || []),
    ...(linksData?.meta?.externalLinks || [])
  ];

  // Analyze Links
  const analyzedLinks = allLinks.map(link => ({
    ...link,
    isContextual: isContextual(link.text, link.href)
  }));

  const contextualLinks = analyzedLinks.filter(l => l.isContextual);
  const nonContextualLinks = analyzedLinks.filter(l => !l.isContextual);

  // Determine score based on ratio
  const contextualRatio = allLinks.length > 0 ? contextualLinks.length / allLinks.length : 0;
  const derivedScore = contextualRatio > 0.5 ? 1 : (contextualRatio > 0.3 ? 0.7 : 0);
  const finalScore = score !== undefined ? score : derivedScore; // Prefer API score if exists

  const isPassed = finalScore > 0.7; // Strict threshold for contextual

  // Status Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (finalScore > 0.4
      ? (darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100")
      : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100")
    );

  const statusText = isPassed ? "Good Context" : "Improve Relevance";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group lg:col-span-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Link size={24} className={darkMode ? "text-amber-400" : "text-amber-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Contextual Links</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({contextualLinks.length} / {allLinks.length} Contextual)
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => { e.stopPropagation(); onInfo(); }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* New Viz: Contextual vs Non-Contextual Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contextual Links */}
          <div className={`rounded-xl border overflow-hidden flex flex-col ${darkMode ? "bg-black/20 border-gray-700" : "bg-gray-50 border-gray-200"}`} style={{ maxHeight: '300px' }}>
            <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider sticky top-0 bg-opacity-90 backdrop-blur ${darkMode ? "bg-emerald-900/30 border-gray-700 text-emerald-400" : "bg-emerald-50 border-gray-200 text-emerald-700"}`}>
              Contextual Links ({contextualLinks.length})
            </div>
            <div className="overflow-y-auto custom-scrollbar p-1 space-y-1 flex-1">
              {contextualLinks.length > 0 ? contextualLinks.map((link, i) => (
                <a key={i} href={resolveLink(link.href)} target="_blank" rel="noopener noreferrer" className={`block p-2 rounded text-[10px] break-all border group/link transition-all ${darkMode ? "bg-emerald-900/10 border-transparent hover:bg-emerald-900/20" : "bg-white border-transparent hover:border-emerald-200 hover:shadow-sm"}`}>
                  <div className={`font-bold mb-0.5 ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>"{link.text}"</div>
                  <div className="opacity-50 font-mono text-[9px] truncate group-hover/link:opacity-80 transition-opacity">{link.href}</div>
                </a>
              )) : <div className="p-4 text-center opacity-50 text-[10px]">No contextual links found.</div>}
            </div>
          </div>

          {/* Non-Contextual Links */}
          <div className={`rounded-xl border overflow-hidden flex flex-col ${darkMode ? "bg-black/20 border-gray-700" : "bg-gray-50 border-gray-200"}`} style={{ maxHeight: '300px' }}>
            <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider sticky top-0 bg-opacity-90 backdrop-blur ${darkMode ? "bg-amber-900/30 border-gray-700 text-amber-400" : "bg-amber-50 border-gray-200 text-amber-700"}`}>
              Non-Contextual Links ({nonContextualLinks.length})
            </div>
            <div className="overflow-y-auto custom-scrollbar p-1 space-y-1 flex-1">
              {nonContextualLinks.length > 0 ? nonContextualLinks.map((link, i) => (
                <a key={i} href={resolveLink(link.href)} target="_blank" rel="noopener noreferrer" className={`block p-2 rounded text-[10px] break-all border group/link transition-all ${darkMode ? "bg-amber-900/10 border-transparent hover:bg-amber-900/20" : "bg-white border-transparent hover:border-amber-200 hover:shadow-sm"}`}>
                  <div className={`font-bold mb-0.5 ${darkMode ? "text-amber-300" : "text-amber-700"}`}>"{link.text}"</div>
                  <div className="opacity-50 font-mono text-[9px] truncate group-hover/link:opacity-80 transition-opacity">{link.href}</div>
                </a>
              )) : <div className="p-4 text-center opacity-50 text-[10px]">All links are contextual!</div>}
            </div>
          </div>
        </div>

        {/* Analysis & Recs from API */}
        {meta.why_this_occurred && !isPassed && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                <AlertTriangle size={12} />
                <span>Analysis</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {meta.why_this_occurred}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                <CheckCircle size={12} />
                <span>Recommendation</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {meta.how_to_fix}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Specialized Link Profile Card
// ------------------------------------------------------
const LinkProfileCard = ({ data, darkMode, onInfo, resolveLink, className = "lg:col-span-3" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const isPassed = score === 1;
  const [activeTab, setActiveTab] = React.useState("internal"); // internal | external

  // Colors
  const statusColor = isPassed
    ? (darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100")
    : (score >= 0.5
      ? (darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100")
      : (darkMode ? "text-red-400 bg-red-900/20 border-red-800/30" : "text-red-600 bg-red-50 border-red-100")
    );

  const statusText = isPassed ? "Healthy Profile" : "Optimization Needed";

  const renderLinkList = (links, type) => {
    if (!links || links.length === 0) {
      return (
        <div className="p-4 text-center opacity-60 italic text-xs">
          No {type} links found.
        </div>
      );
    }



    // Group links by their target
    const grouped = links.reduce((acc, link) => {
      const t = link.target || "_self";
      if (!acc[t]) acc[t] = [];
      acc[t].push(link);
      return acc;
    }, {});

    return (
      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-4">
        {Object.entries(grouped)
          .sort(([a], [b]) => {
            if (a === "_self") return -1;
            if (b === "_self") return 1;
            return a.localeCompare(b);
          })
          .map(([target, groupLinks]) => (
            <div key={target} className="space-y-1">
              <div className={`sticky top-0 z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border-b ${darkMode ? "bg-gray-800/80 border-gray-700 text-gray-400" : "bg-white/80 border-gray-100 text-gray-500"}`}>
                Target: <span className={darkMode ? "text-gray-200" : "text-gray-800"}>{target}</span> <span className="opacity-50">({groupLinks.length})</span>
              </div>
              {groupLinks.map((link, i) => {

                return (
                  <a
                    key={i}
                    href={resolveLink ? resolveLink(link.href) : link.href}
                    target={link.target === "_blank" ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className={`group block p-2 rounded border transition-all ${darkMode ? "bg-gray-900/30 border-gray-700 hover:bg-gray-800" : "bg-white border-gray-100 hover:bg-gray-50 hover:border-blue-200"}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${type === "internal" ? "bg-blue-500" : "bg-purple-500"}`} />
                        <span className={`text-xs font-bold truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {link.text || "[No Text]"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">


                        {/* Target Badge */}
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${darkMode ? "bg-gray-800 text-gray-400 border border-gray-700" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                          {link.target || "_self"}
                        </span>
                      </div>
                    </div>
                    <div className={`text-[10px] font-mono truncate opacity-50 pl-3.5 group-hover:opacity-100 ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                      {link.href}
                    </div>
                  </a>
                );
              })}
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Globe size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Link Profile</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.total || 0} Total Links)
                </span>
              </div>
            </div>
          </div>

          {onInfo && (
            <button
              onClick={(e) => { e.stopPropagation(); onInfo(); }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div title="Links pointing to pages on the same domain" onClick={() => setActiveTab("internal")} className={`cursor-pointer p-3 rounded border text-center transition-all ${activeTab === "internal" ? (darkMode ? "bg-blue-900/20 border-blue-500 ring-1 ring-blue-500" : "bg-blue-50 border-blue-500 ring-1 ring-blue-500") : (darkMode ? "bg-gray-900/50 border-gray-700 hover:border-gray-600" : "bg-gray-50 border-gray-200 hover:border-gray-300")}`}>
            <div className={`text-2xl font-black ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{meta.internal || 0}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Internal</div>
          </div>

          <div title="Links pointing to different domains" onClick={() => setActiveTab("external")} className={`cursor-pointer p-3 rounded border text-center transition-all ${activeTab === "external" ? (darkMode ? "bg-purple-900/20 border-purple-500 ring-1 ring-purple-500" : "bg-purple-50 border-purple-500 ring-1 ring-purple-500") : (darkMode ? "bg-gray-900/50 border-gray-700 hover:border-gray-600" : "bg-gray-50 border-gray-200 hover:border-gray-300")}`}>
            <div className={`text-2xl font-black ${darkMode ? "text-purple-400" : "text-purple-600"}`}>{meta.external || 0}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">External</div>
          </div>

          <div className={`p-3 rounded border text-center ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
            <div className={`text-2xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{meta.unique || 0}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Unique</div>
          </div>
        </div>

        {/* Link Lists Tabs */}
        <div className={`rounded-xl border overflow-hidden ${darkMode ? "bg-black/20 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider flex justify-between items-center ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
            <span>{activeTab === "internal" ? "Internal Links" : "External Links"}</span>
            <span className="opacity-50 text-[10px]">
              Total: {activeTab === "internal" ? meta.internalLinks?.length : meta.externalLinks?.length}
            </span>
          </div>
          <div className="bg-opacity-50">
            {activeTab === "internal"
              ? renderLinkList(meta.internalLinks, "internal")
              : renderLinkList(meta.externalLinks, "external")
            }
          </div>
        </div>

        {/* Analysis Details */}
        {meta.why_this_occurred && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                <AlertTriangle size={12} />
                <span>Analysis</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {meta.why_this_occurred}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                <CheckCircle size={12} />
                <span>Recommendation</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {meta.how_to_fix}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------
export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <Search className="w-8 h-8 text-blue-500" />, title: "Metadata Analysis", text: "Scanning Title tags, Meta Descriptions, and URL structure for SEO best practices..." },
    { icon: <Layout className="w-8 h-8 text-purple-500" />, title: "Content Structure", text: "Evaluating Heading Hierarchy (H1-H6) and semantic HTML5 tags..." },
    { icon: <FileCode className="w-8 h-8 text-teal-500" />, title: "Technical SEO", text: "Verifying Canonical tags, Robots.txt, Sitemap presence, and HTTPS security..." },
    { icon: <ImageIcon className="w-8 h-8 text-indigo-500" />, title: "Visual Assets", text: "Checking image Alt text, file sizes, and video optimization..." },
    { icon: <Link className="w-8 h-8 text-amber-500" />, title: "Link Profile", text: "Analyzing internal linking structure, identifying broken links and orphan pages..." },
    { icon: <Copy className="w-8 h-8 text-red-500" />, title: "Content Quality", text: "Detecting duplicate content, thin pages, and keyword consistency..." },
    { icon: <Globe className="w-8 h-8 text-emerald-500" />, title: "Social Signals", text: "Reviewing Open Graph tags and Twitter Cards for social media optimization..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.onPageSEO) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.onPageSEO) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader data={data} darkMode={darkMode} />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <SeoShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const seo = data.onPageSEO;
  const overallScore = seo.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  // Helper to resolve relative links against the base URL
  const resolveLink = (href) => {
    if (!href) return "#";
    try {
      return new URL(href, data.url).href;
    } catch (e) {
      return href;
    }
  };


  // Calculate Passed/Failed
  // Updated to support both old (Score) and new (score) formats temporarily or permanently
  const getScore = (metric) => metric?.score !== undefined ? metric.score : metric?.Score;

  const allMetrics = [
    seo.Title, seo.Meta_Description, seo.URL_Structure, seo.Canonical, seo.H1,
    seo.Image, seo.Video, seo.Heading_Hierarchy, seo.Semantic_Tags,
    seo.Contextual_Linking, seo.Links, seo.Duplicate_Content, seo.URL_Slugs, seo.HTTPS
  ].filter(Boolean);

  const passedCount = allMetrics.filter(m => (getScore(m) !== undefined ? (getScore(m) > 1 ? 100 : getScore(m) * 100) : 0) >= 90).length;
  const failedCount = allMetrics.filter(m => (getScore(m) !== undefined ? (getScore(m) > 1 ? 100 : getScore(m) * 100) : 0) < 90).length;

  const desc = {
    title: seo.Title?.details || "Main headline in search results.",
    meta: seo.Meta_Description?.details || "Summary text in search results.",
    url: seo.URL_Structure?.details || "Address bar structure.",
    canonical: seo.Canonical?.details || "Prevents duplicate content.",
    h1: seo.H1?.details || "Main page heading.",
    image: seo.Image?.details || "Alt text for accessibility.",
    video: seo.Video?.details || "Embedded video content.",
    imagecompression: "File size optimization.",
    heading: seo.Heading_Hierarchy?.details || "Logical content structure.",
    semantic: seo.Semantic_Tags?.details || "HTML5 structural tags.",
    structured: "Schema.org metadata.",
    contextual: seo.Contextual_Linking?.details || "Internal links in content.",
    https: seo.HTTPS?.details || "Secure connection.",
    links: seo.Links?.details || "Internal and external navigation.",
    duplicate: seo.Duplicate_Content?.details || "Content uniqueness.",
    slug: seo.URL_Slugs?.details || "URL path readability.",
  };

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          {/* 2. Card Body */}
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            {/* Right Panel: Metrics & Score */}
            <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
              <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-10" : "space-y-8"}`}>

                {/* Top Content Area */}
                <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>

                  {/* Text Content */}
                  <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                    <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                        <Search className="w-3.5 h-3.5" />
                        <span>SEO Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        On-Page <span className="text-blue-500">SEO</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Deep dive into your content strategy, technical structure, and user experience signals.
                      </p>
                    </div>

                    {/* Stats & Tools */}
                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                      <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className="text-sm font-bold">{passedCount} Passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-rose-500" />
                          <span className="text-sm font-bold">{failedCount} Failed</span>
                        </div>
                      </div>
                      <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                      <button
                        onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                        className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                      >
                        <Info size={16} />
                        <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress */}
                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${overallScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={overallScore} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{overallScore}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Content Essentials */}
        <Section title="Content Essentials" icon={FileText} darkMode={darkMode} gridClasses="grid-cols-1 md:grid-cols-2">
          {/* Title Tag Card */}
          <TitleTagCard
            data={seo.Title}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Title, icon: Tag })}
          />

          {/* Meta Description Card */}
          <MetaDescriptionCard
            data={seo.Meta_Description}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Meta_Description, icon: FileText })}
          />
          {/* Canonical Tag Card */}
          <CanonicalTagCard
            data={seo.Canonical}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Canonical, icon: Copy })}
          />
          {/* URL Structure Card */}
          <URLStructureCard
            data={seo.URL_Structure}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.URL_Structure, icon: Link })}
          />

          {/* H1 Tag Card */}
          <H1TagCard
            data={seo.H1}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.H1, icon: Layout })}
          />
        </Section>

        {/* Media & Accessibility */}
        <Section title="Media & Accessibility" icon={ImageIcon} darkMode={darkMode}>
          {/* Image Analysis Card */}
          {seo.Image?.meta?.total > 0 && (
            <ImageAnalysisCard
              data={seo.Image}
              darkMode={darkMode}
              onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Image, icon: ImageIcon })}
              baseUrl={data.url}
            />
          )}



          {seo.Video?.meta?.total > 0 && (
            <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Video, icon: Video })} title="Internal Videos" description={desc.video} score={seo.Video?.score} value={seo.Video?.meta?.total + " Found"} darkMode={darkMode} icon={Video}>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Total</div>
                  <div className="text-lg font-bold">{seo.Video.meta.total}</div>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Embedded</div>
                  <div className="text-lg font-bold">{seo.Video.meta.embeddingCount ?? seo.Video.meta.embedding}</div>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Lazy Load</div>
                  <div className={`text-lg font-bold ${seo.Video.meta.lazyCount === seo.Video.meta.total ? "text-green-500" : "text-yellow-500"}`}>{seo.Video.meta.lazyCount || 0}</div>
                </div>
                <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="opacity-70">Metadata</div>
                  <div className={`text-lg font-bold ${seo.Video.meta.metaCount > 0 ? "text-green-500" : "text-red-500"}`}>{seo.Video.meta.metaCount || 0}</div>
                </div>
              </div>
            </MetricCard>
          )}
        </Section>

        {/* Structure & Semantics */}
        <Section title="Structure & Semantics" icon={Layout} darkMode={darkMode}>
          <SemanticTagsCard
            data={seo.Semantic_Tags}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Semantic_Tags, icon: FileCode })}
            className="lg:col-span-3"
          />
          <ContextualAnalysisCard
            data={seo.Contextual_Linking}
            linksData={seo.Links}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Contextual_Linking, icon: Link })}
            resolveLink={resolveLink}
          />
          {seo.Heading_Hierarchy && (
            <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Heading_Hierarchy, icon: List })} title="Hierarchy" description={desc.heading} score={seo.Heading_Hierarchy?.score} value={seo.Heading_Hierarchy?.score ? "Logical" : "Broken"} darkMode={darkMode} icon={List} className="md:col-span-2 lg:col-span-3">
              <div className="space-y-4">
                {/* Heading Counts */}
                <div className="grid grid-cols-6 gap-2 text-center">
                  {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => (
                    <div key={tag} className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="text-xs font-bold opacity-60 uppercase">{tag}</div>
                      <div className={`font-bold text-lg ${seo.Heading_Hierarchy?.meta?.counts?.[tag] > 0 ? (darkMode ? "text-blue-400" : "text-blue-600") : "text-gray-400"}`}>
                        {seo.Heading_Hierarchy?.meta?.counts?.[tag] || 0}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heading List */}
                {seo.Heading_Hierarchy?.meta?.headings?.length > 0 && (
                  <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                    <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                      Heading Structure
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {seo.Heading_Hierarchy.meta.headings.map((h, i) => {
                        const indent = {
                          h1: '',
                          h2: 'ml-4',
                          h3: 'ml-8',
                          h4: 'ml-12',
                          h5: 'ml-16',
                          h6: 'ml-20'
                        };
                        return (
                          <div key={i} className={`flex items-start gap-3 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${indent[h.tag] || ''}`}>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0 ${h.tag === 'h1' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                              h.tag === 'h2' ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" :
                                h.tag === 'h3' ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300" :
                                  h.tag === 'h4' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                    h.tag === 'h5' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" :
                                      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" // H6
                              }`}>
                              {h.tag}
                            </span>
                            <span className={`text-sm truncate ${h.tag === 'h1' ? "font-bold" :
                              h.tag === 'h2' ? "font-semibold opacity-95" :
                                h.tag === 'h3' ? "font-medium opacity-90" :
                                  "opacity-80"
                              } ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                              {h.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Issues (if any) */}
                {seo.Heading_Hierarchy?.meta?.issues?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-red-500 text-sm">Hierarchy Issues:</div>
                    {seo.Heading_Hierarchy.meta.issues.map((issue, i) => (
                      <div key={i} className="text-xs opacity-90 flex items-start gap-2">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                        <span>{issue.finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MetricCard>
          )}
        </Section>

        {/* Technical SEO */}
        <Section title="Technical SEO" icon={Lock} darkMode={darkMode} gridClasses="grid-cols-1 md:grid-cols-2">
          <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.HTTPS, icon: Lock })} title="HTTPS" description={seo.HTTPS?.details || "Secure connection."} score={seo.HTTPS?.score} value={seo.HTTPS?.score === 1 ? "Secure Connection" : "Insecure Connection"} darkMode={darkMode} icon={Lock}>
            {seo.HTTPS?.meta?.url && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${seo.HTTPS.score === 1 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                    {seo.HTTPS.score === 1 ? "HTTPS" : "HTTP"}
                  </div>
                  <div className={`text-xs font-mono break-all ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {seo.HTTPS.meta.url}
                  </div>
                </div>
              </div>
            )}
          </MetricCard>
          <MetricCard
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Content_Quality, icon: Copy })}
            title="Content Quality"
            description={desc.duplicate}
            score={seo.Duplicate_Content?.score}
            value={seo.Duplicate_Content?.score === 1 ? "Good" : seo.Duplicate_Content?.score === 0.5 ? "Repetitive" : "Thin"}
            darkMode={darkMode}
            icon={Copy}
          >
            <div className="space-y-3">
              <div className="text-sm font-semibold">
                Total Words: <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{seo.Duplicate_Content?.meta?.wordCount || 0}</span>
              </div>

              {seo.Duplicate_Content?.meta?.repeatedSentences?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500 text-xs uppercase tracking-wide">Repetitive Sentences:</div>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                    {seo.Duplicate_Content.meta.repeatedSentences.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        <span className="text-xs opacity-90 italic line-clamp-2" title={item.text}>
                          "{item.text}"
                        </span>
                        <span className="text-xs font-bold text-red-500 whitespace-nowrap bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                          x{item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </MetricCard>
          <LinkProfileCard
            data={seo.Links}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Links, icon: Globe })}
            resolveLink={resolveLink}
            className="md:col-span-2"
          />


          {/* Hreflang - Wrapped in Card */}
          {(seo.Hreflang?.Results?.length > 0 || seo.Hreflang?.Issues?.length > 0) && (
            <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Hreflang, icon: Globe })} title="Hreflang" description="International targeting." score={seo.Hreflang?.score} value={seo.Hreflang?.score === 1 ? "Valid" : "Issues"} darkMode={darkMode} icon={Globe}>
              <div className="space-y-3">
                {seo.Hreflang?.Results?.length > 0 && (
                  <div className="space-y-1">
                    <div className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Link Validation</div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {seo.Hreflang.Results.map((res, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                {res.hreflang}
                              </span>
                              <span className={`text-[10px] font-mono opacity-80 truncate max-w-[150px]`} title={res.target}>
                                {res.target}
                              </span>
                            </div>
                          </div>
                          <div className={`text-xs font-bold whitespace-nowrap ${res.returnLink === "PASS" ? "text-green-500" : "text-red-500"}`}>
                            {res.returnLink === "PASS" ? "Valid" : "Missing"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {seo.Hreflang?.Issues?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-red-500 text-xs">Validation Issues:</div>
                    {seo.Hreflang.Issues.map((issue, i) => (
                      <div key={i} className="text-xs opacity-90 flex items-start gap-2 text-red-400">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <span>{issue.finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MetricCard>
          )}

          {/* Slugs - Always show */}
          <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.URL_Slugs, icon: Link })} title="URL Slugs" description={desc.slug} score={seo.URL_Slugs?.score} value={seo.URL_Slugs?.score === 1 ? "Valid" : "Issues Found"} darkMode={darkMode} icon={Link}>
            <div className="space-y-2">
              {seo.URL_Slugs?.meta?.slug && (
                <div className={`text-xs font-mono p-1.5 rounded break-all ${darkMode ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  /{seo.URL_Slugs.meta.slug}
                </div>
              )}
              {seo.URL_Slugs?.meta?.issues?.length > 0 ? (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500 text-xs uppercase">Slug Issues:</div>
                  {seo.URL_Slugs.meta.issues.map((issue, i) => (
                    <div key={i} className="text-xs opacity-90 flex items-start gap-2">
                      <XCircle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs opacity-70 flex items-center gap-1 text-green-500">
                  <CheckCircle size={12} />
                  <span>Slug format matches SEO best practices.</span>
                </div>
              )}
            </div>
          </MetricCard>
        </Section>

        {/* Schema Data */}
        <div className={`rounded-xl p-8 shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <FileCode size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            <h3 className={`text-xl font-bold ${textColor}`}>Detected Schema Markup</h3>
          </div>
          <div className={`p-4 rounded-lg overflow-x-auto border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            <pre className="text-xs font-mono leading-relaxed">
              {!data.siteSchema ? "No Schema Markup Found" : JSON.stringify(data.siteSchema, null, 2)}
            </pre>
          </div>
        </div>

        {/* Social Media Optimization */}
        <Section title="Social Media Optimization" icon={Globe} darkMode={darkMode}>
          {/* Open Graph Card */}
          <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Open_Graph, icon: Globe })} title="Open Graph" description={seo.Open_Graph?.details || "Social sharing meta tags."} score={seo.Open_Graph?.score} value={seo.Open_Graph?.score === 1 ? "Optimized" : "Missing / Incomplete"} darkMode={darkMode} icon={Globe}>
            <div className="space-y-3">
              {seo.Open_Graph?.meta?.tags && (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(seo.Open_Graph.meta.tags).map(([key, val], i) => (
                    <div key={i} className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                      <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5">{key}</div>
                      <div className={`text-xs font-mono break-all ${val ? (darkMode ? "text-blue-300" : "text-blue-600") : "text-red-500 italic"}`}>
                        {val || "Missing"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {seo.Open_Graph?.meta?.missing?.length > 0 && (
                <div className="text-xs text-red-500 font-medium">
                  Missing: {seo.Open_Graph.meta.missing.join(", ")}
                </div>
              )}
            </div>
          </MetricCard>

          {/* Twitter Card */}
          <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Twitter_Card, icon: Globe })} title="Twitter Card" description={seo.Twitter_Card?.details || "Twitter specific meta tags."} score={seo.Twitter_Card?.score} value={seo.Twitter_Card?.score === 1 ? "Optimized" : "Missing / Incomplete"} darkMode={darkMode} icon={Globe}>
            <div className="space-y-3">
              {seo.Twitter_Card?.meta?.tags && (
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(seo.Twitter_Card.meta.tags).map(([key, val], i) => (
                    <div key={i} className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                      <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5">{key}</div>
                      <div className={`text-xs font-mono break-all ${val ? (darkMode ? "text-cyan-300" : "text-cyan-600") : "text-red-500 italic"}`}>
                        {val || "Missing"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {seo.Twitter_Card?.meta?.missing?.length > 0 && (
                <div className="text-xs text-red-500 font-medium">
                  Missing: {seo.Twitter_Card.meta.missing.join(", ")}
                </div>
              )}
            </div>
          </MetricCard>

          {/* Social Links Card */}
          <MetricCard onInfo={() => setSelectedParameterInfo({ ...seoMetricExplanations.Social_Links, icon: Globe })} title="Social Profiles" description="Detected social media links." score={seo.Social_Links?.score} value={seo.Social_Links?.meta?.count + " Found"} darkMode={darkMode} icon={Globe}>
            {seo.Social_Links?.meta?.links?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {seo.Social_Links.meta.links.map((link, i) => {
                  let domain = "Link";
                  try { domain = new URL(link).hostname.replace("www.", ""); } catch { }
                  return (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded border transition-colors ${darkMode ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-blue-300" : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-blue-600"}`}>
                      <Link size={12} className="opacity-50" />
                      <span className="text-xs font-medium truncate">{domain}</span>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs opacity-60 italic">No social profile links detected on page.</div>
            )}
          </MetricCard>
        </Section>

      </main>
      {/* Methodology Modal */}
      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
      {/* Parameter Modal */}
      <ParameterInfoModal
        isOpen={!!selectedParameterInfo}
        onClose={() => setSelectedParameterInfo(null)}
        info={selectedParameterInfo}
        darkMode={darkMode}
      />
    </div >
  );
}