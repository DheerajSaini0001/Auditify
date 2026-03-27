import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Search, FileText, Link, Image as ImageIcon, Video,
  Layout, FileCode, Lock, Copy, List, Tag, Globe,
  CheckCircle, AlertTriangle, XCircle, Info, Loader2, ArrowRight,
  ChevronDown, ChevronUp, ExternalLink, Box, Check
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";
import ScoreBadge from "../Component/reusablecomponent/ScoreBadge";
import SEOCard from "../Component/reusablecomponent/SEOCard";
import { AuditShimmer } from "../Component/reusablecomponent/AuditShimmer";
import AskAIButton from "../Component/AskAIButton";

const getStatusFromScore = (score) => {
  if (score >= 90) return "pass";
  if (score >= 50) return "warning";
  return "fail";
};

// Score Calculation Info (Standard Weights)
const scoreCalculationInfo = InfoDetails.On_Page_SEO_Methodology;

// Simple Section (Custom for On-Page SEO grid layouts)
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

// Specialized Title Tag Card
const TitleTagCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";

  const statusText = isPassed ? "Optimized" : "Needs Improvement";

  const [showDetails, setShowDetails] = React.useState(false);

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
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.length || 0} characters)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {analysis && !isPassed && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${darkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
              >
                {showDetails ? "Hide Details" : "View Details"}
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
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
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Title.whatThisParameterIs}
            </span>
          </div>


          {/* The Title Itself */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Current Title
            </h4>
            <div className={`p-3 rounded-lg border font-serif text-lg leading-snug ${darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
              {meta.title || <span className="italic opacity-50">No title found</span>}
            </div>
          </div>

          {/* Why it matters */}
          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Title.whyItMatters}
            </span>
          </div>

          {/* Analysis Details (Only if toggled) */}
          {showDetails && analysis && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.cause}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Specialized Meta Description Card
const MetaDescriptionCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const statusText = isPassed ? "Optimized" : "Needs Improvement";

  return (
    <SEOCard
      title="Meta Description"
      icon={FileText}
      iconColor="text-purple-400"
      score={data?.score}
      status={getStatusFromScore(score)}
      statusText={statusText}
      meta={meta}
      analysis={data?.analysis}
      metricKey="Meta_Description"
      darkMode={darkMode}
      onInfo={onInfo}
      className="col-span-1"
      headerInfo={`(${meta.length || 0} characters)`}
      getStatusFromScore={getStatusFromScore}
      InfoDetails={InfoDetails}
    >
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          Current Description
        </h4>
        <div className={`p-3 rounded-lg border font-serif text-sm leading-relaxed ${darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}>
          {meta.description || <span className="italic opacity-50">No meta description found</span>}
        </div>
      </div>
    </SEOCard>
  );
};
// ------------------------------------------------------
// Specialized Canonical Tag Card
// ------------------------------------------------------
const CanonicalTagCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const statusText = isPassed ? "Optimized" : "Warning / Info";

  return (
    <SEOCard
      title="Canonical Tag"
      icon={Copy}
      iconColor="text-pink-400"
      score={data?.score}
      status={getStatusFromScore(score)}
      statusText={statusText}
      meta={meta}
      analysis={data?.analysis}
      metricKey="Canonical"
      darkMode={darkMode}
      onInfo={onInfo}
      className="col-span-1"
      getStatusFromScore={getStatusFromScore}
      InfoDetails={InfoDetails}
      headerInfo={meta.isSelfReferencing && (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${darkMode ? "border-blue-500/30 text-blue-400 bg-blue-500/10" : "border-blue-200 text-blue-600 bg-blue-50"}`}>
          Self-Referencing
        </span>
      )}
    >
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          Canonical URL
        </h4>
        <div className={`p-3 rounded-lg border font-mono text-xs break-all ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
          {meta.canonical || <span className="italic opacity-50">No canonical tag found</span>}
        </div>
      </div>
    </SEOCard>
  );
};

// ------------------------------------------------------
// Specialized URL Structure Card
// ------------------------------------------------------
const URLStructureCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const statusText = isPassed ? "Clean Details" : "Issues Found";

  return (
    <SEOCard
      title="URL Structure"
      icon={Link}
      iconColor="text-cyan-400"
      score={data?.score}
      status={getStatusFromScore(score)}
      statusText={statusText}
      meta={meta}
      analysis={data?.analysis}
      metricKey="URL_Structure"
      darkMode={darkMode}
      onInfo={onInfo}
      className="col-span-1"
      getStatusFromScore={getStatusFromScore}
      InfoDetails={InfoDetails}
    >
      <div>
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          Analyzed URL
        </h4>
        <div className={`p-3 rounded-lg border font-mono text-xs break-all ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
          {meta.url || <span className="italic opacity-50">No URL data</span>}
        </div>
      </div>
    </SEOCard>
  );
};

// ------------------------------------------------------
// Specialized H1 Tag Card
// ------------------------------------------------------
// Specialized H1 Tag Card
const H1TagCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";
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
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.count || 0} Found)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.H1.whatThisParameterIs}
            </span>
          </div>

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

          {/* Why it matters */}
          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.H1.whyItMatters}
            </span>
          </div>

          {/* Analysis Details */}
          {analysis && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.cause}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// Specialized Image Analysis Card
// ------------------------------------------------------
const ImageAnalysisCard = ({ data, darkMode, onInfo, resolveLink, className = "" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";

  const statusText = isPassed ? "Fully Optimized" : (score >= 50 ? "Good / Improvements" : "Needs Attention");

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
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.total || 0} Total Images)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
        </div>

        {/* Content Body */}
        <div className="space-y-6">
          {/* Description */}
          <div >
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Image.whatThisParameterIs}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            {/* 1. With Alt */}
            <div className={`p-2 rounded border ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{meta.withAlt || 0}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">With Alt</div>
            </div>

            {/* 2. Without Alt (New) */}
            <div className={`p-2 rounded border ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-lg font-bold ${meta.missingAlt?.length > 0 ? "text-amber-500" : (darkMode ? "text-white" : "text-gray-900")}`}>
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

            {/* 5. Broken Images */}
            {meta.broken_images?.length > 0 && (
              <div className={`p-2 rounded border ${darkMode ? "bg-red-900/20 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                <div className={`text-lg font-bold text-red-500`}>
                  {meta.broken_images_count || meta.broken_images?.length || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-red-500 tracking-wider flex justify-center items-center gap-1 opacity-80">
                  <AlertTriangle size={10} /> Broken
                </div>
              </div>
            )}
          </div>

          {/* Issues List (Clickable Links) */}
          {
            (meta.missingAlt?.length > 0 || meta.missingTitle?.length > 0 || meta.largeImages?.length > 0 || meta.broken_images?.length > 0) && (
              <div className="space-y-3">
                {/* 0. Broken Images */}
                {meta.broken_images?.length > 0 && (
                  <div className={`text-xs p-3 rounded border border-red-500/20 bg-red-500/5`}>
                    <div className="font-bold text-red-500 mb-2 uppercase flex items-center gap-1">
                      <AlertTriangle size={10} /> Broken Images ({meta.broken_images_count})
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                      {meta.broken_images.map((imgObj, i) => {
                        const isString = typeof imgObj === "string";
                        const srcUrl = isString ? imgObj : imgObj.src;
                        const errorMsg = isString ? "Broken" : (imgObj.error || "Broken");
                        
                        return (
                          <div key={i} className="flex items-center justify-between gap-2 p-1 -mx-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors group/link">
                            <a
                              href={resolveLink(srcUrl || "")}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 overflow-hidden hover:underline flex-1 truncate"
                              title={srcUrl}
                            >
                              <div className="truncate opacity-70 font-mono text-[10px] group-hover/link:opacity-100 group-hover/link:text-red-500 transition-colors">
                                {srcUrl}
                              </div>
                            </a>
                            <div className="text-[9px] font-bold text-red-500/80 uppercase whitespace-nowrap shrink-0 px-1 bg-red-500/10 rounded">
                              {errorMsg}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* 1. Missing Alt Text */}
                {meta.missingAlt?.length > 0 && (
                  <div className={`text-xs p-3 rounded border border-amber-500/20 bg-amber-500/5`}>
                    <div className="font-bold text-amber-500 mb-2 uppercase flex items-center gap-1">
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
            )
          }

          {/* Why it matters */}
          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Image.whyItMatters}
            </span>
          </div>

          {/* Analysis Details */}
          {analysis && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.cause}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          )}
          
          {/* Ask AI Button (Always show if not passed) */}
          {!isPassed && (
            <div className="pt-2">
              <AskAIButton
                finding={{ type: 'On-Page SEO', title: 'Image Optimization', details: analysis?.recommendation || 'Optimize images for better SEO and performance.', severity: status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'critical', url: '' }}
                darkMode={darkMode}
                meta={meta}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ------------------------------------------------------
// Specialized Semantic Tags Card
// ------------------------------------------------------
const SemanticTagsCard = ({ data, darkMode, onInfo, className }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";

  const statusText = isPassed ? "Excellent Structure" : (score >= 50 ? "Good Structure" : "Weak Structure");

  const renderTagBadge = (tagName, isCritical) => {
    const exists = meta.found?.some(t => t.toLowerCase() === tagName.toLowerCase());
    return (
      <div key={tagName} className={`flex items-center justify-between px-2 py-1 rounded border transition-colors ${exists ? (darkMode ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-700") : (isCritical ? (darkMode ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-700") : (darkMode ? "bg-gray-800 border-gray-700 text-gray-500" : "bg-gray-50 border-gray-200 text-gray-400"))}`}>
        <span className="font-mono text-[10px] font-bold">&lt;{tagName}&gt;</span>
        {exists ? <Check size={10} /> : (isCritical ? <AlertTriangle size={10} /> : <div className="w-[10px]" />)}
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
              <Box size={24} className={darkMode ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Semantic Structure</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
        </div>

        {/* Tag Grid */}
        <div className="space-y-3">
          {/* Description */}
          <div className="mb-4">
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Semantic_Tags.whatThisParameterIs}
            </span>
          </div>

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
        {
          meta.potentialReplacements?.length > 0 && (
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
          )
        }

        {/* Why it matters */}
        <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
          <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {InfoDetails.Semantic_Tags.whyItMatters}
          </span>
        </div>

        {/* Analysis Details */}
        {
          analysis && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.cause}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          )
        }

      </div>
    </div>
  );
};

// ------------------------------------------------------
// Specialized Contextual Analysis Card
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
      const rawSlug = cleanPath.split('/').pop().toLowerCase();
      const slug = rawSlug.replace(/[^a-z0-9]/g, "");
      if (!slug) return false;

      // 1. Exact Substring match
      if (normalizedText.includes(slug) || slug.includes(normalizedText)) {
        return true;
      }

      // 2. Word Overlap match
      const textWords = text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
      const slugWords = rawSlug.split(/[^a-z0-9]+/).filter(w => w.length > 2);

      let overlap = 0;
      for (const w of textWords) {
        if (slugWords.includes(w)) overlap++;
      }

      // Allow if there is a meaningful overlap (1+ overlapping significant words)
      if (overlap > 0) return true;

      return false;
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
  const derivedScore = contextualRatio > 0.5 ? 100 : (contextualRatio > 0.3 ? 70 : 0);
  const finalScore = score !== undefined ? (score <= 1 ? score * 100 : score) : derivedScore;
  const finalStatus = data?.status || (finalScore >= 90 ? "pass" : finalScore >= 50 ? "warning" : "fail");

  const isPassed = finalStatus === "pass";
  const statusText = isPassed ? "Good Context" : "Improve Relevance";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group lg:col-span-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <ExternalLink size={24} className={darkMode ? "text-amber-400" : "text-amber-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Contextual Links</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(finalScore)}
                  value={statusText}
                  darkMode={darkMode}
                />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({contextualLinks.length} / {allLinks.length} Contextual)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
        </div>

        {/* New Viz: Contextual vs Non-Contextual Lists */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Contextual_Linking.whatThisParameterIs}
            </span>
          </div>

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

          {/* Broken Contextual Links */}
          <div className={`text-xs p-4 rounded-xl border ${meta.broken_links?.length > 0 ? "border-red-500/20 bg-red-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <div className={`font-bold mb-2 uppercase flex items-center gap-1 ${meta.broken_links?.length > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {meta.broken_links?.length > 0 ? <AlertTriangle size={14} className="mt-[-2px]" /> : <CheckCircle size={14} className="mt-[-2px]" />}
              Broken Contextual Links ({meta.broken_links_count || 0})
            </div>
            
            {meta.broken_links?.length > 0 ? (
              <>
                <p className={`mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  These contextual links are returning an error (e.g., 404 Not Found) when accessed.
                </p>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 p-2 bg-black/5 dark:bg-black/20 rounded">
                  {meta.broken_links.map((linkObj, i) => (
                    <div key={i} className={`flex justify-between items-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} p-2 rounded border shadow-sm`}>
                      <div className="flex items-center gap-2 font-mono text-[11px] truncate mr-2">
                        <span className="font-bold text-red-500 dark:text-red-400 shrink-0 truncate">
                          {linkObj.status ? `HTTP ${linkObj.status}` : linkObj.error || "Broken"}
                        </span>
                      </div>
                      <a href={resolveLink(linkObj.url || "")} target="_blank" rel="noopener noreferrer" className={`font-mono text-[10px] truncate transition-colors max-w-[70%] text-right ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}>
                        {linkObj.url || "—"}
                      </a>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className={`${darkMode ? "text-emerald-400/80" : "text-emerald-700/80"}`}>
                Perfect! All your contextual links are valid and completely functional.
              </p>
            )}
          </div>

          {/* Why it matters */}
          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Contextual_Linking.whyItMatters}
            </span>
          </div>

          {/* Analysis & Recs from API */}
          {data?.analysis && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {data?.analysis?.cause}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {data?.analysis?.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Ask AI Button (Always show if not passed) */}
          {!isPassed && (
            <div className="pt-2">
              <AskAIButton
                finding={{ type: 'On-Page SEO', title: 'Contextual Links', details: data?.analysis?.recommendation || 'Improve contextual linking relevance.', severity: finalScore >= 90 ? 'pass' : finalScore >= 50 ? 'warning' : 'critical', url: '' }}
                darkMode={darkMode}
                meta={data?.meta}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LinkProfileCard = ({ data, darkMode, onInfo, resolveLink, className = "lg:col-span-3" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const [activeTab, setActiveTab] = React.useState("internal");

  const statusText = isPassed ? "Healthy Link Profile" : "Needs Review";

  const renderLinkList = (links, type) => {
    if (!links || links.length === 0) {
      return <div className="p-4 text-center opacity-50 text-[10px]">No {type} links found.</div>;
    }
    return (
      <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
        {links.map((link, i) => (
          <div key={i} className={`p-2 rounded text-[10px] break-all border group/link transition-all ${darkMode ? "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800" : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className={`font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>"{link.text || "No Anchor Text"}"</span>
              {link.target === "_blank" && <ExternalLink size={10} className="mt-0.5 opacity-40 shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              {link.target && (
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border opacity-70 shrink-0 ${darkMode ? "border-gray-600 text-gray-400 bg-gray-900/50" : "border-gray-200 text-gray-500 bg-gray-50"}`}>
                  {link.target}
                </span>
              )}
              <a href={resolveLink(link.href)} target="_blank" rel="noopener noreferrer" className={`font-mono text-[9px] truncate transition-colors flex-1 min-w-0 ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}>
                {link.href}
              </a>
            </div>
          </div>
        ))}
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
              <Link size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Link Profile</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.total || 0} Total Links)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
        </div>

        {/* Description & Why it matters */}
        <div className="space-y-3">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Links.whatThisParameterIs}
            </span>
          </div>
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

        {/* Generic Anchor Texts */}
        {meta.bad_links?.length > 0 && (
          <div className={`text-xs p-4 rounded-xl border border-amber-500/20 bg-amber-500/5`}>
            <div className="font-bold text-amber-500 mb-2 uppercase flex items-center gap-1">
              <AlertTriangle size={14} className="mt-[-2px]" /> Generic Anchor Text ({meta.bad_links_count})
            </div>
            <p className={`mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              These links use non-descriptive anchor text like "click here". Replacing them with relevant keywords improves context for search engines.
            </p>
            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 p-2 bg-black/5 dark:bg-black/20 rounded">
              {meta.bad_links.map((link, i) => (
                <div key={i} className={`flex justify-between items-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} p-2 rounded border shadow-sm`}>
                  <div className="flex items-center gap-2 font-mono text-[11px] truncate mr-2">
                    <span className="opacity-50 text-[10px] shrink-0">&lt;a&gt;</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 truncate">"{link.text || link}"</span>
                    <span className="opacity-50 text-[10px] shrink-0">&lt;/a&gt;</span>
                  </div>
                  <a href={resolveLink(link.href || "")} target="_blank" rel="noopener noreferrer" className={`font-mono text-[9px] truncate transition-colors max-w-[45%] text-right ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}>
                    {link.href || "—"}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Why it matters */}
        <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
          <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {InfoDetails.Links.whyItMatters}
          </span>
        </div>

        {/* Analysis Details */}
        {data.analysis && !isPassed && (
          <>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {data.analysis.cause}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {data.analysis.recommendation}
                </p>
              </div>
            </div>

            {/* Ask AI Button */}
            <AskAIButton
              finding={{ type: 'On-Page SEO', title: 'Link Profile', details: data?.analysis?.recommendation || '', severity: status === 'pass' ? 'pass' : status === 'warning' ? 'warning' : 'critical', url: '' }}
              darkMode={darkMode}
              meta={meta}
            />
          </>
        )}

      </div>
    </div>
  );
};

// ------------------------------------------------------
// Specialized Heading Hierarchy Card
// ------------------------------------------------------
const HeadingHierarchyCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";

  const statusText = isPassed ? "Logical Structure" : "Imbalanced Hierarchy";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 md:col-span-2 lg:col-span-3 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <List size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Heading Hierarchy</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
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
          {/* Description */}
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Heading_Hierarchy.whatThisParameterIs}
            </span>
          </div>

          <div className="space-y-4">
            {/* Heading Counts */}
            <div className="grid grid-cols-6 gap-2 text-center">
              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => (
                <div key={tag} className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <div className="text-[10px] font-bold opacity-60 uppercase">{tag}</div>
                  <div className={`font-bold text-lg ${meta?.counts?.[tag] > 0 ? (darkMode ? "text-blue-400" : "text-blue-600") : "text-gray-400"}`}>
                    {meta?.counts?.[tag] || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Heading List */}
            {meta?.headings?.length > 0 && (
              <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                  Heading Structure
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {meta.headings.map((h, i) => {
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
          </div>

          {/* Why it matters */}
          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Heading_Hierarchy.whyItMatters}
            </span>
          </div>

          {/* Analysis Details */}
          {(meta?.issues?.length > 0 || !isPassed) && (
            <>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                {/* Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                    <AlertTriangle size={12} />
                    <span>Analysis</span>
                  </div>
                  <div className="space-y-1">
                    {meta?.issues?.length > 0 ? meta.issues.map((issue, i) => (
                      <div key={i} className="text-sm opacity-90 flex items-start gap-2">
                        <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>• {issue.finding}</span>
                      </div>
                    )) : (
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {data?.analysis?.cause || "Hierarchy is logical and follows SEO best practices."}
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                    <CheckCircle size={12} />
                    <span>Recommendation</span>
                  </div>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {data?.analysis?.recommendation || "Ensure headings follow a logical sequence (H1 → H2 → H3) and don't skip levels."}
                  </p>
                </div>
              </div>

              {/* Ask AI Button */}
              <AskAIButton
                finding={{ type: 'On-Page SEO', title: 'Heading Hierarchy', details: data?.analysis?.recommendation || '', severity: isPassed ? 'pass' : isWarning ? 'warning' : 'critical', url: '' }}
                darkMode={darkMode}
                meta={meta}
              />
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// Specialized Content Quality Card
// ------------------------------------------------------
const ContentQualityCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";

  const statusText = isPassed ? "High Quality" : (score >= 50 ? "Acceptable Depth" : "Thin Content / Repetition");

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group col-span-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Copy size={24} className={darkMode ? "text-rose-400" : "text-rose-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Content Quality</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
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
          {/* Description */}
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Content_Quality.whatThisParameterIs}
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">
              Total Words: <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{meta?.wordCount || 0}</span>
            </div>

            {meta?.repeatedSentences?.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-red-500 text-xs uppercase tracking-wide">Repetitive Sentences:</div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                  {meta.repeatedSentences.map((item, i) => (
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

          {/* Why it matters */}
          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Content_Quality.whyItMatters}
            </span>
          </div>

          {/* Analysis Details */}
          {data.analysis && !isPassed && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              {/* Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  <AlertTriangle size={12} />
                  <span>Analysis</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {data.analysis.cause}
                </p>
              </div>

              {/* Recommendation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
                  <CheckCircle size={12} />
                  <span>Recommendation</span>
                </div>
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {data.analysis.recommendation}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// Specialized Video Analysis Card
// ------------------------------------------------------
const VideoAnalysisCard = ({ data, darkMode, onInfo, className = "" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const analysis = data?.analysis;
  const isPassed = status === "pass";

  const statusText = isPassed ? "Fully Optimized" : (score >= 50 ? "Partially Optimized" : "Needs Attention");

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Video size={24} className={darkMode ? "text-purple-400" : "text-purple-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Video Optimization</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={statusText}
                  darkMode={darkMode}
                />
                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ({meta.total || 0} Videos)
                </span>
              </div>
            </div>
          </div>
          {onInfo && (
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <Info size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Video?.whatThisParameterIs || "Evaluates how videos are optimized for performance and discovery."}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-900/50" : "bg-gray-50"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Embedded</div>
              <div className="text-lg font-bold">{meta.embeddingCount ?? meta.embedding ?? 0}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-900/50" : "bg-gray-50"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Lazy Loaded</div>
              <div className={`text-lg font-bold ${meta.lazyCount === meta.total ? "text-green-500" : "text-amber-500"}`}>{meta.lazyCount || 0}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-900/50" : "bg-gray-50"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Schema Markup</div>
              <div className={`text-lg font-bold ${meta.metaCount > 0 ? "text-green-500" : "text-red-500"}`}>{meta.metaCount || 0}</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-900/50" : "bg-gray-50"} border ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Health Score</div>
              <div className="text-lg font-bold">{(score * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Video?.whyItMatters || "Optimized videos improve user engagement and can appear in rich search results."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// Specialized URL Slugs Card
// ------------------------------------------------------
const URLSlugCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const statusText = isPassed ? "Clean Slugs" : "SEO Issues Found";

  return (
    <SEOCard
      title="URL Slug"
      icon={Link}
      iconColor="text-emerald-400"
      score={score}
      statusText={statusText}
      meta={meta}
      metricKey="URL_Slugs"
      darkMode={darkMode}
      onInfo={onInfo}
      className="col-span-1"
      getStatusFromScore={getStatusFromScore}
      InfoDetails={InfoDetails}
      showAnalysis={false}
    >
      <div className="space-y-2">
        {meta?.slug && meta.slug !== "/" ? (
          <div className={`text-xs font-mono p-1.5 rounded break-all ${darkMode ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
            /{meta.slug}
          </div>
        ) : (
          <div className={`text-xs font-bold p-1.5 rounded ${darkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
            You are at root URL
          </div>
        )}
        {meta?.issues?.length > 0 ? (
          <div className="space-y-1">
            <div className="font-semibold text-amber-500 text-xs uppercase">Slug Issues:</div>
            {meta.issues.map((issue, i) => (
              <div key={i} className="text-xs opacity-90 flex items-start gap-2 text-amber-500">
                <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
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

      {/* Custom Analysis Section for Slugs */}
      {data.analysis && !isPassed && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <AlertTriangle size={12} />
              <span>Analysis</span>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {data.analysis.cause}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
              <CheckCircle size={12} />
              <span>Recommendation</span>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {data.analysis.recommendation || "Use lowercase letters, numbers, and hyphens. Avoid spaces or underscores."}
            </p>
          </div>
        </div>
      )}
    </SEOCard>
  );
};

// ------------------------------------------------------
// Specialized Robots.txt Card
// ------------------------------------------------------
const RobotsTxtCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const statusText = data?.details || (isPassed ? "Found" : "Missing");

  return (
    <SEOCard
      title="Robots.txt"
      icon={FileCode}
      iconColor="text-orange-400"
      score={score}
      status={data.status}
      statusText={statusText}
      analysis={data.analysis}
      meta={meta}
      metricKey="Robots_Txt"
      darkMode={darkMode}
      onInfo={onInfo}
      className="col-span-1"
      getStatusFromScore={getStatusFromScore}
      InfoDetails={InfoDetails}
      showAnalysis={false}
    >
      {meta?.content && (
        <div className="space-y-1">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>File content (Preview):</div>
          <pre className={`p-2 rounded text-[10px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-600 border border-gray-100"}`}>
            {meta.content}
          </pre>
        </div>
      )}

      {/* Custom Analysis */}
      {data.analysis && !isPassed && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <AlertTriangle size={12} />
              <span>Analysis</span>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {data.analysis.cause}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
              <CheckCircle size={12} />
              <span>Recommendation</span>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {data.analysis.recommendation}
            </p>
          </div>
        </div>
      )}
    </SEOCard>
  );
};

// ------------------------------------------------------
// Specialized Sitemap Card
// ------------------------------------------------------
const SitemapCard = ({ data, darkMode, onInfo }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";
  const statusText = data?.details || (isPassed ? "Found" : "Missing");

  return (
    <SEOCard
      title="XML Sitemap"
      icon={Search}
      iconColor="text-blue-400"
      score={score}
      status={status}
      statusText={statusText}
      analysis={data.analysis}
      meta={meta}
      metricKey="Sitemap"
      darkMode={darkMode}
      onInfo={onInfo}
      className="col-span-1"
      getStatusFromScore={getStatusFromScore}
      InfoDetails={InfoDetails}
      showAnalysis={false}
    >
      {data?.details && data.details.toLowerCase().includes("outdated") && (
        <div className={`p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 mb-4`}>
          <div className="font-bold text-amber-500 flex items-center gap-2 mb-2">
            <AlertTriangle size={16} />
            Sitemap Outdated
          </div>
          {meta?.outdatedReason ? (
            <p className={`text-xs ${darkMode ? "text-amber-400/90" : "text-amber-800/90"} font-medium`}>
              {meta.outdatedReason}
            </p>
          ) : (
            <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              A sitemap was found, but it appears to be outdated (older than 6 months or missing tags).
            </p>
          )}
        </div>
      )}

      {meta?.content && (
        <div className="space-y-1">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>File content (Preview):</div>
          <pre className={`p-2 rounded text-[10px] font-mono whitespace-pre-wrap max-h-92 overflow-y-auto ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-600 border border-gray-100"}`}>
            {meta.content}
          </pre>
        </div>
      )}

      {/* Custom Analysis */}
      {data.analysis && !isPassed && (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <AlertTriangle size={12} />
              <span>Analysis</span>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {data.analysis.cause}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500">
              <CheckCircle size={12} />
              <span>Recommendation</span>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {data.analysis.recommendation}
            </p>
          </div>
        </div>
      )}
    </SEOCard>
  );
};



const StructuredDataCard = ({ data, darkMode, onInfo, className = "" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Tag size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Structured Data</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={isPassed ? "Detected" : "Missing"}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
          {onInfo && (
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <Info size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Structured_Data.whatThisParameterIs}
            </span>
          </div>

          {meta?.types && (
            <div className="space-y-1">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Detected Schema Types:</div>
              <div className={`flex flex-wrap gap-1`}>
                {meta.types.split(',').map((type, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-medium ${darkMode ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
                    {type.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {meta?.content?.length > 0 && (
            <div className="space-y-1">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Raw JSON-LD Content:</div>
              <pre className={`p-2 rounded text-[10px] font-mono whitespace-pre-wrap max-h-80 overflow-y-auto ${darkMode ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-600 border border-gray-100"}`}>
                {JSON.stringify(meta.content, null, 2)}
              </pre>
            </div>
          )}

          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Structured_Data.whyItMatters}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


// ------------------------------------------------------
// Specialized Social Media Cards
// ------------------------------------------------------

const OpenGraphCard = ({ data, darkMode, onInfo, className = "" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Globe size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Open Graph</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={isPassed ? "Optimized" : "Improvement Needed"}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
          {onInfo && (
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <Info size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Open_Graph.whatThisParameterIs}
            </span>
          </div>

          {meta?.tags && (
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(meta.tags).map(([key, val], i) => (
                <div key={i} className={`p-2 rounded border ${darkMode ? "bg-gray-900/40 border-gray-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                  <div className="text-[9px] font-bold uppercase opacity-50 mb-0.5">{key.replace("og:", "")}</div>
                  <div className={`text-xs font-mono break-all ${val ? (darkMode ? "text-blue-300" : "text-blue-600") : "text-red-500 italic"}`}>
                    {val || "Missing"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Open_Graph.whyItMatters}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TwitterCardCard = ({ data, darkMode, onInfo, className = "" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Globe size={24} className={darkMode ? "text-cyan-400" : "text-cyan-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Twitter Card</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={isPassed ? "Optimized" : "Improvement Needed"}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
          {onInfo && (
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <Info size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Twitter_Card.whatThisParameterIs}
            </span>
          </div>

          {meta?.tags && (
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(meta.tags).map(([key, val], i) => (
                <div key={i} className={`p-2 rounded border ${darkMode ? "bg-gray-900/40 border-gray-700/50" : "bg-gray-50/50 border-gray-100"}`}>
                  <div className="text-[9px] font-bold uppercase opacity-50 mb-0.5">{key.replace("twitter:", "")}</div>
                  <div className={`text-xs font-mono break-all ${val ? (darkMode ? "text-cyan-300" : "text-cyan-600") : "text-red-500 italic"}`}>
                    {val || "Missing"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Twitter_Card.whyItMatters}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialProfilesCard = ({ data, darkMode, onInfo, className = "" }) => {
  const meta = data?.meta || {};
  const score = data?.score || 0;
  const status = data?.status || "fail";
  const isPassed = status === "pass";

  const getPlatformInfo = (url) => {
    const u = url.toLowerCase();
    if (u.includes('facebook.com')) return { name: 'Facebook', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    if (u.includes('twitter.com') || u.includes('x.com')) return { name: 'Twitter / X', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' };
    if (u.includes('linkedin.com')) return { name: 'LinkedIn', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
    if (u.includes('instagram.com')) return { name: 'Instagram', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' };
    if (u.includes('youtube.com')) return { name: 'YouTube', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    return { name: 'Social Profile', color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' };
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-shadow group ${className} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Globe size={24} className={darkMode ? "text-purple-400" : "text-purple-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Social Profiles</h3>
              <div className={`flex items-center gap-2 mt-1`}>
                <ScoreBadge
                  status={getStatusFromScore(score)}
                  value={`${meta.count || 0} Profiles Detected`}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>
          {onInfo && (
            <button onClick={(e) => { e.stopPropagation(); onInfo(); }} className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <Info size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>DESCRIPTION: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Social_Links.whatThisParameterIs}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {meta.links?.length > 0 ? (
              meta.links.map((link, i) => {
                const info = getPlatformInfo(link);
                return (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-2.5 rounded-lg border group/link transition-all ${darkMode ? "bg-gray-900/40 border-gray-700/50 hover:bg-gray-700/50" : "bg-gray-50/50 border-gray-100 hover:bg-gray-100/50 hover:border-gray-200"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded ${info.color}`}>
                        <Link size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[10px] font-bold uppercase tracking-tight opacity-60`}>{info.name}</span>
                        <span className={`text-xs font-medium truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{new URL(link).hostname.replace("www.", "")}</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover/link:opacity-100 translate-x-[-10px] group-hover/link:translate-x-0 transition-all text-blue-500" />
                  </a>
                );
              })
            ) : (
              <div className={`col-span-2 p-4 rounded-lg border border-dashed ${darkMode ? "bg-gray-900/30 border-gray-700 text-gray-500" : "bg-gray-50 border-gray-200 text-gray-400"} text-center text-xs italic`}>
                No official social profiles detected in the page code.
              </div>
            )}
          </div>

          <div className={`pt-3 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>WHY IT MATTERS: </span>
            <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {InfoDetails.Social_Links.whyItMatters}
            </span>
          </div>
        </div>
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
    { icon: <FileCode className="w-8 h-8 text-teal-500" />, title: "Technical SEO", text: "Verifying Canonical tags, Robots.txt, and Sitemap presence..." },
    { icon: <ImageIcon className="w-8 h-8 text-indigo-500" />, title: "Visual Assets", text: "Checking image Alt text, file sizes, and video optimization..." },
    { icon: <Link className="w-8 h-8 text-amber-500" />, title: "Link Profile", text: "Analyzing internal linking structure, identifying broken links and orphan pages..." },
    { icon: <Copy className="w-8 h-8 text-red-500" />, title: "Content Quality", text: "Detecting duplicate content, thin pages, and keyword consistency..." },
    { icon: <Globe className="w-8 h-8 text-emerald-500" />, title: "Social Signals", text: "Reviewing Open Graph tags and Twitter Cards for social media optimization..." },
  ], []);

  const seo = data?.onPageSEO || {};
  const overallScore = seo.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  // Calculate metrics stats using useMemo for performance
  const metricStats = useMemo(() => {
    const metrics = [
      seo.Title,
      seo.Meta_Description,
      seo.URL_Structure,
      seo.URL_Slugs,
      seo.Canonical,
      seo.H1,
      seo.Heading_Hierarchy,
      seo.Semantic_Tags,
      seo.Image,
      seo.Video,
      seo.Contextual_Linking,
      seo.Links,
      seo.Duplicate_Content,
      seo.Robots_Txt,
      seo.Sitemap,
      seo.Structured_Data,
      seo.Open_Graph,
      seo.Twitter_Card,
      seo.Social_Links
    ].filter(Boolean);

    let passed = 0;
    let warning = 0;
    let failed = 0;

    metrics.forEach(m => {
      const status = m?.status ?? "fail";

      if (status === "pass") passed++;
      else if (status === "warning") warning++;
      else failed++;
    });

    return { passed, warning, failed, total: metrics.length };
  }, [seo]);

  if (!data?.onPageSEO) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          {/* Unified Master Card Loading State */}
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
                  <AuditShimmer darkMode={darkMode} loading={loading} data={data?.onPageSEO} auditSteps={auditSteps} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }



  // Helper to resolve relative links against the base URL
  const resolveLink = (href) => {
    if (!href) return "#";
    try {
      return new URL(href, data.url).href;
    } catch (e) {
      return href;
    }
  };




  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* Unified Master Card */}
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
                          <span className="text-sm font-bold">{metricStats.passed} Passed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-500" />
                          <span className="text-sm font-bold">{metricStats.warning} Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-rose-500" />
                          <span className="text-sm font-bold">{metricStats.failed} Failed</span>
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

        {/* Content Mastery */}
        <Section title="Content Mastery" icon={FileText} darkMode={darkMode} gridClasses="grid-cols-1 md:grid-cols-2">
          <TitleTagCard
            data={seo.Title}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Title, icon: Tag })}
          />
          <H1TagCard
            data={seo.H1}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.H1, icon: Layout })}
          />
          <MetaDescriptionCard
            data={seo.Meta_Description}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Meta_Description, icon: FileText })}
          />
          <ContentQualityCard
            data={seo.Duplicate_Content}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Content_Quality, icon: Copy })}
          />
          <ContextualAnalysisCard
            data={seo.Contextual_Linking}
            linksData={seo.Links}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Contextual_Linking, icon: Link })}
            resolveLink={resolveLink}
            className="md:col-span-2"
          />
        </Section>

        {/* Technical Foundation */}
        <Section title="Technical Foundation" icon={Lock} darkMode={darkMode} gridClasses="grid-cols-1 md:grid-cols-2">
          <CanonicalTagCard
            data={seo.Canonical}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Canonical, icon: Copy })}
          />
          <RobotsTxtCard
            data={seo.Robots_Txt}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Robots_Txt, icon: FileCode })}
          />
          <SitemapCard
            data={seo.Sitemap}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Sitemap, icon: Search })}
          />
          <StructuredDataCard
            data={seo.Structured_Data}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Structured_Data, icon: Tag })}
          />
          <URLStructureCard
            data={seo.URL_Structure}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.URL_Structure, icon: Link })}
          />
          <URLSlugCard
            data={seo.URL_Slugs}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.URL_Slugs, icon: Link })}
          />
        </Section>

        {/* Media & Experience */}
        <Section title="Media & Experience" icon={ImageIcon} darkMode={darkMode} gridClasses="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {seo.Image?.meta?.total > 0 && (
            <ImageAnalysisCard
              data={seo.Image}
              darkMode={darkMode}
              onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Image, icon: ImageIcon })}
              resolveLink={resolveLink}
              className="lg:col-span-2"
            />
          )}

          {seo.Video?.meta?.total > 0 && (
            <VideoAnalysisCard
              data={seo.Video}
              darkMode={darkMode}
              onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Video, icon: Video })}
            />
          )}

          {seo.Heading_Hierarchy && (
            <HeadingHierarchyCard
              data={seo.Heading_Hierarchy}
              darkMode={darkMode}
              onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Heading_Hierarchy, icon: List })}
            />
          )}

          <SemanticTagsCard
            data={seo.Semantic_Tags}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Semantic_Tags, icon: FileCode })}
            className="lg:col-span-3"
          />
        </Section>

        {/* Social & Authority */}
        <Section title="Social & Authority" icon={Globe} darkMode={darkMode} gridClasses="grid-cols-1 md:grid-cols-2">
          <LinkProfileCard
            data={seo.Links}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Links, icon: Globe })}
            resolveLink={resolveLink}
            className="md:col-span-2"
          />
          <OpenGraphCard
            data={seo.Open_Graph}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Open_Graph, icon: Globe })}
          />
          <TwitterCardCard
            data={seo.Twitter_Card}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Twitter_Card, icon: Globe })}
          />
          <SocialProfilesCard
            data={seo.Social_Links}
            darkMode={darkMode}
            onInfo={() => setSelectedParameterInfo({ ...InfoDetails.Social_Links, icon: Globe })}
            className="md:col-span-2"
          />
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
    </div>
  );
}
