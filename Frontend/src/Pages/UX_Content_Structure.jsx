import React, { useContext } from "react";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  Layout,
  Type,
  Smartphone,
  MoveHorizontal,
  PanelTop,
  Menu,
  ChevronRight,
  Compass,
  Touchpad,
  BookOpen,
  Layers,
  Image as ImageIcon,
  XOctagon,
  MonitorPlay,
  MousePointer2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Activity,
  Loader2,
  Check,
  X
} from "lucide-react";

// ------------------------------------------------------
// 🎨 Utilities & Helpers
// ------------------------------------------------------
const getStatusColor = (score) => {
  if (score >= 90) return {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-500",
    badge: "bg-emerald-500 text-white"
  };
  if (score >= 50) return {
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-500",
    badge: "bg-amber-500 text-white"
  };
  return {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: "text-rose-500",
    badge: "bg-rose-500 text-white"
  };
};

// ------------------------------------------------------
// 🦴 Skeleton Loader
// ------------------------------------------------------
const UxShimmer = ({ darkMode }) => (
  <div className={`min-h-screen p-8 ${darkMode ? "bg-slate-950" : "bg-gray-50"}`}>
    <div className={`h-64 w-full rounded-3xl mb-12 ${darkMode ? "bg-slate-900" : "bg-white"} animate-pulse`}></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`h-64 rounded-3xl ${darkMode ? "bg-slate-900" : "bg-white"} animate-pulse`}></div>
      ))}
    </div>
  </div>
);

// ------------------------------------------------------
// 📊 Shared Components
// ------------------------------------------------------

const StatusIcon = ({ status }) => (
  status ?
    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500"><Check size={12} strokeWidth={3} /></div> :
    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-500"><X size={12} strokeWidth={3} /></div>
);

// ------------------------------------------------------
// 👁️ Specific Views
// ------------------------------------------------------

const ReadabilityView = ({ meta, darkMode }) => {
  const stats = meta?.overallStats || {};

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <div className={`text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>FLESH SCORE</div>
          <div className={`text-xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.score?.toFixed(1) || "N/A"}</div>
        </div>
        <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <div className={`text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>AVG SENTENCE LENGTH</div>
          <div className={`text-xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>
            {stats.ASL?.toFixed(1) || "0"} <span className="text-xs font-normal opacity-60">words</span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
          <div className={`text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>AVG SYLLABLES PER WORD</div>
          <div className={`text-xl font-black ${darkMode ? "text-white" : "text-gray-900"}`}>{stats.ASW?.toFixed(2) || "0"}</div>
        </div>
      </div>

      {/* Issues List */}
      {meta?.problematicContent?.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className={`text-xs font-bold uppercase ${darkMode ? "text-slate-500" : "text-gray-500"}`}>Issues Found:</div>
          {meta.problematicContent.map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${darkMode ? "bg-rose-500/5 border-rose-500/10" : "bg-rose-50 border-rose-100"}`}>
              <p className={`text-xs italic mb-2 ${darkMode ? "text-slate-300" : "text-gray-700"}`}>"{item.text}"</p>
              <div className="text-[10px] font-bold text-rose-500">{item.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ClickFeedbackView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-4">
    <div className="flex justify-between text-xs">
      <span className={darkMode ? "text-slate-400" : "text-gray-600"}>Interactive Elements:</span>
      <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{meta?.totalInteractive || 0}</span>
    </div>
    <div className="flex justify-between text-xs">
      <span className={darkMode ? "text-slate-400" : "text-gray-600"}>Feedback Detected:</span>
      <span className={`font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{meta?.withFeedback || 0}</span>
    </div>

    {/* Table */}
    <div className="mt-2">
      <div className={`grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"}`}>
        <div className="col-span-2">Tag</div>
        <div className="col-span-6">Content</div>
        <div className="col-span-2 text-center">Hover</div>
        <div className="col-span-2 text-center">Active</div>
      </div>
      <div className={`max-h-60 overflow-y-auto custom-scrollbar border-x border-b rounded-b-lg ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
        {meta?.elements?.map((item, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b last:border-0 items-center ${darkMode ? "border-slate-800 hover:bg-slate-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
            <div className="col-span-2 font-mono opacity-70">{item.tag}</div>
            <div className="col-span-6 truncate" title={item.text}>{item.text || <span className="italic opacity-50">No text</span>}</div>
            <div className="col-span-2 flex justify-center"><StatusIcon status={item.feedback?.hoverChanged} /></div>
            <div className="col-span-2 flex justify-center"><StatusIcon status={item.feedback?.activeChanged} /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FormValidationView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-3 gap-2 text-center mb-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
        <div className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{meta?.totalInputs || 0}</div>
        <div className="text-[9px] uppercase font-bold opacity-60">Total</div>
      </div>
      <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
        <div className={`text-lg font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>{meta?.withLabels || 0}</div>
        <div className="text-[9px] uppercase font-bold opacity-60">Labeled</div>
      </div>
      <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800" : "bg-gray-100"}`}>
        <div className={`text-lg font-bold ${darkMode ? "text-rose-400" : "text-rose-600"}`}>{meta?.withErrors || 0}</div>
        <div className="text-[9px] uppercase font-bold opacity-60">Errors</div>
      </div>
    </div>

    {/* Table */}
    <div>
      <div className={`grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"}`}>
        <div className="col-span-4">Input</div>
        <div className="col-span-4">Label</div>
        <div className="col-span-2 text-center">Has Label</div>
        <div className="col-span-2 text-center">Has Error</div>
      </div>
      <div className={`max-h-60 overflow-y-auto custom-scrollbar border-x border-b rounded-b-lg ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
        {meta?.inputs?.map((item, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b last:border-0 items-center ${darkMode ? "border-slate-800 hover:bg-slate-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
            <div className="col-span-4 truncate font-mono opacity-70" title={item.name || item.id}>{item.name || item.id || item.type || "input"}</div>
            <div className="col-span-4 truncate italic opacity-60" title={item.labelText}>{item.labelText || "No Label"}</div>
            <div className="col-span-2 flex justify-center"><StatusIcon status={item.hasLabel} /></div>
            <div className="col-span-2 flex justify-center"><StatusIcon status={item.hasErrorMessage} /></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ATFView = ({ meta, darkMode }) => {
  const percentage = meta?.totalImportant > 0 ? Math.round((meta.importantVisible / meta.totalImportant) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end mb-1">
        <span className={`text-xs font-bold uppercase ${darkMode ? "text-slate-400" : "text-gray-500"}`}>Visible Important Elements</span>
        <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{meta?.importantVisible} / {meta?.totalImportant}</span>
      </div>

      {/* Progress Bar */}
      <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-gray-200"}`}>
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>

      <p className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
        Weighted ATF Score: <span className="font-bold text-emerald-500">{meta?.atfScore}%</span>. {meta?.importantVisible} important elements visible out of {meta?.totalImportant} total.
      </p>

      {/* Table */}
      <div className="mt-2">
        <div className={`grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"}`}>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Tag</div>
          <div className="col-span-6">Content</div>
          <div className="col-span-2 text-right">Weight</div>
        </div>
        <div className={`max-h-60 overflow-y-auto custom-scrollbar border-x border-b rounded-b-lg ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
          {meta?.elements?.map((item, idx) => (
            <div key={idx} className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b last:border-0 items-center ${darkMode ? "border-slate-800 hover:bg-slate-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
              <div className="col-span-2"><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${darkMode ? "bg-slate-700 text-slate-300" : "bg-gray-200 text-gray-600"}`}>{item.tag === 'IMG' || item.tag === 'VIDEO' ? 'MEDIA' : 'TEXT'}</span></div>
              <div className="col-span-2 font-mono opacity-60">{item.tag}</div>
              <div className="col-span-6 truncate" title={item.text}>{item.text}</div>
              <div className="col-span-2 text-right font-mono opacity-60">{item.weight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const NavDiscoverabilityView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-3 mt-2">
    <div className="flex justify-between items-center p-3 rounded-lg border border-dashed border-slate-700/50">
      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Hamburger Menu</span>
      <span className={`text-xs font-bold px-2 py-1 rounded ${meta?.hamburger_present ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
        {meta?.hamburger_present ? "Present" : "Missing"}
      </span>
    </div>
    <div className="flex justify-between items-center p-3 rounded-lg border border-dashed border-slate-700/50">
      <span className={`text-sm ${darkMode ? "text-slate-300" : "text-gray-700"}`}>Search Bar</span>
      <span className={`text-xs font-bold px-2 py-1 rounded ${meta?.search_present ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
        {meta?.search_present ? "Present" : "Missing"}
      </span>
    </div>
    <p className={`text-xs mt-2 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>
      Checks for common navigation patterns like hamburger menus and search inputs.
    </p>
  </div>
);

const LoadingFeedbackView = ({ meta, darkMode }) => {
  if (!meta) return null;
  const { summary } = meta;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center text-xs">
        <span className={darkMode ? "text-slate-400" : "text-gray-600"}>Spinners Detected:</span>
        <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{summary?.spinners || 0}</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={darkMode ? "text-slate-400" : "text-gray-600"}>Skeletons Detected:</span>
        <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{summary?.skeletons || 0}</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={darkMode ? "text-slate-400" : "text-gray-600"}>Loading Text Detected:</span>
        <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{summary?.loadingText || 0}</span>
      </div>
      <p className={`text-xs mt-2 italic opacity-60 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>
        {meta.hasLoadingFeedback ? "Loading indicators found." : "No standard loading indicators detected."}
      </p>
    </div>
  )
}

const GenericListView = ({ items, renderItem, emptyMessage, darkMode }) => {
  if (!items || items.length === 0) {
    return <div className={`text-xs italic mt-2 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>{emptyMessage}</div>;
  }
  return (
    <div className={`mt-3 max-h-48 overflow-y-auto custom-scrollbar pr-2 border-t ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
      {items.map((item, idx) => (
        <div key={idx} className={`py-2 border-b last:border-0 ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
};

const TapTargetView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-2">
    <div className="flex gap-4 text-xs mb-2">
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className={darkMode ? "text-slate-300" : "text-gray-700"}>Passed: {meta?.passed}</span></div>
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className={darkMode ? "text-slate-300" : "text-gray-700"}>Failed: {meta?.failed}</span></div>
    </div>
    {meta?.failed > 0 && (
      <div className={`p-3 rounded-lg ${darkMode ? "bg-rose-500/10" : "bg-rose-50"}`}>
        <div className="text-[10px] font-bold uppercase text-rose-500 mb-2">{meta.failed} Issues Found:</div>
        <div className="max-h-32 overflow-y-auto custom-scrollbar">
          {meta?.smallTargets?.map((item, i) => (
            <div key={i} className={`text-xs mb-1 ${darkMode ? "text-rose-200" : "text-rose-800"}`}>
              • {item.tag} ({Math.round(item.width)}×{Math.round(item.height)}): "{item.text || 'No Text'}"
            </div>
          ))}
        </div>
      </div>
    )}
    <p className={`text-[10px] mt-1 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>
      Interactive elements should be at least 48×48px (mobile) or 44×44px (desktop).
    </p>
  </div>
);

const FontSizeView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-2">
    <div className="flex gap-4 text-xs mb-2">
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className={darkMode ? "text-slate-300" : "text-gray-700"}>Passed: {meta?.passed}</span></div>
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className={darkMode ? "text-slate-300" : "text-gray-700"}>Failed: {meta?.failed}</span></div>
    </div>
    {meta?.failed > 0 && (
      <div className={`p-3 rounded-lg ${darkMode ? "bg-rose-500/10" : "bg-rose-50"}`}>
        <div className="text-[10px] font-bold uppercase text-rose-500 mb-2">{meta.failed} Small Text Elements:</div>
        <div className="max-h-32 overflow-y-auto custom-scrollbar">
          {meta?.smallFonts?.map((item, i) => (
            <div key={i} className={`text-xs mb-1 ${darkMode ? "text-rose-200" : "text-rose-800"}`}>
              • {item.tag} ({item.size || item.fontSize + 'px'}): "{item.text || 'No Text'}"
            </div>
          ))}
        </div>
      </div>
    )}
    <p className={`text-[10px] mt-1 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>
      Text should be at least 16px (mobile) or 14px (desktop).
    </p>
  </div>
);

const NavDepthView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-2">
    <div className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
      {meta?.details}
    </div>
    <div className="mt-2">
      <div className={`grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"}`}>
        <div className="col-span-4">Text</div>
        <div className="col-span-6">Path</div>
        <div className="col-span-2 text-right">Depth</div>
      </div>
      <div className={`max-h-40 overflow-y-auto custom-scrollbar border-x border-b rounded-b-lg ${darkMode ? "border-slate-800" : "border-gray-100"}`}>
        {(meta?.deepLinks || meta?.links)?.map((item, idx) => (
          <div key={idx} className={`grid grid-cols-12 gap-2 px-3 py-2 text-xs border-b last:border-0 items-center ${darkMode ? "border-slate-800 hover:bg-slate-800/50" : "border-gray-100 hover:bg-gray-50"}`}>
            <div className="col-span-4 truncate font-medium" title={item.text}>{item.text || "No Text"}</div>
            <div className="col-span-6 truncate opacity-60 font-mono text-[10px]" title={item.href}>{item.href}</div>
            <div className={`col-span-2 text-right font-bold ${item.depth <= 3 ? "text-emerald-500" : "text-rose-500"}`}>{item.depth}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ImageStabilityView = ({ meta, darkMode }) => (
  <div className="flex flex-col gap-2">
    <div className="flex gap-4 text-xs mb-2">
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className={darkMode ? "text-slate-300" : "text-gray-700"}>Passed: {meta?.passed}</span></div>
      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className={darkMode ? "text-slate-300" : "text-gray-700"}>Failed: {meta?.failed}</span></div>
    </div>
    {meta?.failed > 0 && (
      <div className={`p-3 rounded-lg ${darkMode ? "bg-rose-500/10" : "bg-rose-50"}`}>
        <div className="text-[10px] font-bold uppercase text-rose-500 mb-2">Images Missing Dimensions:</div>
        <div className="max-h-32 overflow-y-auto custom-scrollbar">
          {meta?.unstableImages?.map((item, i) => {
            const url = typeof item === 'string' ? item : item.src;
            return (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs mb-1 text-rose-400 hover:underline break-all">
                <ExternalLink size={10} className="shrink-0" />
                {url}
              </a>
            )
          })}
        </div>
      </div>
    )}
  </div>
);

const GenericView = ({ meta, darkMode }) => {
  if (!meta) return <div className="text-xs opacity-50 mt-2">No specific data available</div>;

  const renderValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === 'boolean') return value ? "Yes" : "No";
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return `${value.length} items`;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return "Empty";
      if (keys.length <= 3) {
        return keys.map(k => `${k}: ${renderValue(value[k])}`).join(', ');
      }
      return `${keys.length} properties`;
    }
    return String(value);
  };

  if (!Array.isArray(meta) && typeof meta === 'object') {
    return (
      <div className="flex flex-col mt-2 gap-1">
        {Object.entries(meta).map(([k, v]) => {
          if (Array.isArray(v) && v.length > 0) return null;
          if (typeof v === 'object' && v !== null && Object.keys(v).length > 5) return null;

          return (
            <div key={k} className="flex justify-between text-xs gap-2">
              <span className={`opacity-60 capitalize ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className={`font-mono font-medium text-right ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                {renderValue(v)}
              </span>
            </div>
          );
        })}
      </div>
    )
  }

  return <div className="text-xs mt-2">{renderValue(meta)}</div>;
};

// ------------------------------------------------------
// 🃏 Always-Expanded Metric Card
// ------------------------------------------------------
const MetricCard = ({ title, description, score, status, meta, darkMode, icon: Icon, type }) => {
  const colors = getStatusColor(score);

  const renderContent = () => {
    switch (type) {
      case 'Tap_Target_Size': return <TapTargetView meta={meta} darkMode={darkMode} />;
      case 'Text_Font_Size': return <FontSizeView meta={meta} darkMode={darkMode} />;
      case 'Image_Stability': return <ImageStabilityView meta={meta} darkMode={darkMode} />;
      case 'Text_Readability': return <ReadabilityView meta={meta} darkMode={darkMode} />;
      case 'Form_Validation': return <FormValidationView meta={meta} darkMode={darkMode} />;
      case 'Click_Feedback': return <ClickFeedbackView meta={meta} darkMode={darkMode} />;
      case 'Above_The_Fold_Content': return <ATFView meta={meta} darkMode={darkMode} />;
      case 'Navigation_Depth': return <NavDepthView meta={meta} darkMode={darkMode} />;
      case 'Loading_Feedback': return <LoadingFeedbackView meta={meta} darkMode={darkMode} />;
      case 'Navigation_Discoverability': return <NavDiscoverabilityView meta={meta} darkMode={darkMode} />;
      default: return <GenericView meta={meta} darkMode={darkMode} />;
    }
  };

  return (
    <div className={`flex flex-col rounded-2xl border h-full transition-all duration-300 overflow-hidden
      ${darkMode
        ? "bg-slate-900/40 border-slate-800 backdrop-blur-sm"
        : "bg-white border-gray-200 shadow-sm hover:shadow-md"}
    `}>

      {/* Header */}
      <div className={`p-5 pb-3 flex justify-between items-start border-b ${darkMode ? "border-slate-800/50" : "border-gray-100"}`}>
        <div className="flex flex-col gap-1">
          <h3 className={`font-bold text-base ${darkMode ? "text-slate-100" : "text-gray-900"}`}>
            {title}
          </h3>
          {/* Status Badge */}
          {score === 100 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500 text-white w-fit">PASS</span>
          )}
        </div>
        <div className={`text-xl font-black ${colors.text}`}>
          {score}/100
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4 flex-grow">
        {/* Description */}
        {description && (
          <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
            {description}
          </p>
        )}

        {/* Dynamic Content */}
        <div className="mt-auto">
          {renderContent()}
        </div>
      </div>

    </div>
  );
};

// ------------------------------------------------------
// 🚀 Main Component
// ------------------------------------------------------
export default function UX_Content_Structure() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  if (loading || !data || data.Status === "inprogress") {
    return <UxShimmer darkMode={darkMode} />;
  }

  const results = data?.UX_or_Content_Structure || {};
  const overallScore = results.Percentage || 0;

  const iconMap = {
    Viewport_Meta_Tag: Smartphone,
    Horizontal_Scroll: MoveHorizontal,
    Sticky_Header_Height: PanelTop,
    Navigation_Depth: Menu,
    Breadcrumbs: ChevronRight,
    Navigation_Discoverability: Compass,
    Tap_Target_Size: Touchpad,
    Text_Readability: BookOpen,
    Text_Font_Size: Type,
    Cumulative_Layout_Shift: Layers,
    Image_Stability: ImageIcon,
    Intrusive_Interstitials: XOctagon,
    Above_The_Fold_Content: MonitorPlay,
    Click_Feedback: MousePointer2,
    Form_Validation: CheckCircle2,
    Loading_Feedback: Loader2
  };

  const metrics = Object.keys(results).filter(k => typeof results[k] === 'object' && results[k]?.Score !== undefined);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${darkMode ? "bg-[#0f0f12]" : "bg-gray-50/50"}`}>

      {/* Hero */}
      <div className={`border-b ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-gray-200"}`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-gray-100 border-gray-200 text-gray-600"}`}>
                  {data.Device} Report
                </span>
                <span className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                  {data.Time_Taken}
                </span>
              </div>
              <h1 className={`text-4xl font-black tracking-tight mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                UX & Content Audit
              </h1>
              <p className={`text-base max-w-xl ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                Detailed performance breakdown for <span className="font-semibold text-indigo-500">{new URL(data.Site).hostname}</span>.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>Overall Score</div>
                <div className={`text-4xl font-black ${overallScore >= 90 ? "text-emerald-500" : overallScore >= 50 ? "text-amber-500" : "text-rose-500"}`}>
                  {overallScore}
                </div>
              </div>
              <CircularProgress value={overallScore} size={80} stroke={8} />
            </div>
          </div>
        </main>
      </div>

      {/* Metrics Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-12">
        {(() => {
          const complexMetrics = [
            "Text_Readability",
            "Click_Feedback",
            "Form_Validation",
            "Above_The_Fold_Content",
            "Navigation_Depth",
            "Tap_Target_Size",
            "Text_Font_Size",
            "Image_Stability",
            "Loading_Feedback",
            "Navigation_Discoverability"
          ];

          const largeCards = metrics.filter(key => complexMetrics.includes(key));
          const smallCards = metrics.filter(key => !complexMetrics.includes(key));

          return (
            <>
              {/* Large Cards */}
              {largeCards.length > 0 && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>Detailed Analysis</h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {largeCards.map((key) => (
                      <MetricCard
                        key={key}
                        type={key}
                        title={key.replaceAll("_", " ")}
                        description={results[key]?.Details}
                        score={results[key]?.Score}
                        status={results[key]?.Status}
                        meta={results[key]?.Meta}
                        darkMode={darkMode}
                        icon={iconMap[key] || Layout}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Small Cards */}
              {smallCards.length > 0 && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>Quick Checks</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {smallCards.map((key) => (
                      <MetricCard
                        key={key}
                        type={key}
                        title={key.replaceAll("_", " ")}
                        description={results[key]?.Details}
                        score={results[key]?.Score}
                        status={results[key]?.Status}
                        meta={results[key]?.Meta}
                        darkMode={darkMode}
                        icon={iconMap[key] || Layout}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </main>
    </div>
  );
}