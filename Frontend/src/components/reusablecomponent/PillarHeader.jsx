import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import CircularProgress from "../CircularProgress";
import { scoreToStatus, statusSolidBg } from "../../utils/statusColors";

/**
 * PillarHeader — the header card every audit pillar shares.
 *
 * All eight pillar pages had grown their own near-copy of this block, which is how
 * they drifted: Technical Performance lost its pass/warn/fail tallies and its
 * methodology link, its title picked up a blue→indigo gradient nothing else used
 * (and the brand guidelines forbid), and AEO ended up with no header card at all.
 * One component, one shape.
 *
 * Deliberately kept dumb — it takes already-computed numbers. Each page owns how
 * its own statuses are counted, because the sections do not agree on where a
 * status lives (On-Page SEO reads direct children, AEO reads `params`, UX reads a
 * separate results map).
 *
 * Props:
 *   badge         { icon, label } — the small pill above the title
 *   chips         optional node — pills sitting beside the badge
 *   note          optional node directly under the description, where most pages
 *                 already put their coverage / confidence / "DealerSiteAudit  Index" copy
 *   title         leading words, rendered in ink
 *   titleAccent   trailing word rendered in Performance Orange
 *   description   one line under the title
 *   stats         { passed, warning, failed }
 *   score         0–100, drives the ring
 *   onMethodology optional; omit and the methodology link is not rendered
 *   extra         optional node rendered under the stats row (e.g. AIO compatibility)
 *   fullReport    true when this sits inside the combined "All" report, which
 *                 renders the whole card a size larger
 */
const PillarHeader = ({
  darkMode,
  fullReport,
  badge,
  chips = null,
  note = null,
  title,
  titleAccent,
  description,
  stats,
  score = 0,
  onMethodology,
  extra = null,
}) => {
  const BadgeIcon = badge?.icon;

  return (
    <div className={`flex-1 ${fullReport ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
      <div className={`w-full ${fullReport ? "" : "max-w-2xl mx-auto"} ${fullReport ? "space-y-7" : "space-y-6"}`}>

        {/* Top Content Area */}
        <div className={`flex flex-col md:flex-row items-center ${fullReport ? "gap-7 md:gap-9 justify-between" : "gap-8 md:gap-8 justify-center"}`}>

          {/* Text Content */}
          <div className={`flex-1 ${fullReport ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
            <div className={`${fullReport ? "space-y-2" : "space-y-1.5"}`}>
              <div className="flex flex-wrap items-center gap-2">
                {badge && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-accentsoft text-accent border border-accent/20"}`}>
                    {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
                    <span>{badge.label}</span>
                  </div>
                )}
                {chips}
              </div>
              <h3 className={`${fullReport ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                {title} {titleAccent && <span className="text-accent">{titleAccent}</span>}
              </h3>
              {description && (
                <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-muted"}`}>
                  {description}
                </p>
              )}
              {note}
            </div>

            {/* Stats & Tools */}
            <div className={`flex flex-wrap items-center ${fullReport ? "gap-6" : "gap-5"}`}>
              {stats && (
                <div className={`flex items-center ${fullReport ? "gap-5" : "gap-4"}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className={`text-xs font-semibold tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{stats.passed} Passed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <span className={`text-xs font-semibold tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{stats.warning} Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle size={18} className="text-rose-500" />
                    <span className={`text-xs font-semibold tracking-widest ${darkMode ? "text-slate-200" : "text-muted"}`}>{stats.failed} Failed</span>
                  </div>
                </div>
              )}
              {stats && onMethodology && (
                <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-surface-2 hidden md:block"}`}></div>
              )}
              {onMethodology && (
                <button
                  onClick={onMethodology}
                  className={`flex items-center gap-2 text-sm font-semibold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-accent hover:text-accenthover"}`}
                >
                  <Info size={16} />
                  <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                </button>
              )}
            </div>

            {extra}
          </div>

          {/* Circular Progress */}
          <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
            {/* Glow behind the ring.
                Derived from the score bands so it can never disagree with the ring,
                but via the muted status colour — NOT the band's own hex. Those five
                hexes are tuned for rings, dots and fills: small, saturated, high
                contrast. Stretched across `-inset-8 blur-3xl` at 25% opacity, the
                "Good" lime (#84CC16) washed the whole header card green. The status
                equivalents (#308D5C / #D18E14 / #DA3D51) are what this always used
                and what reads as a glow rather than a tint. */}
            <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${statusSolidBg(scoreToStatus(score))}`}></div>
            <CircularProgress value={score} size={fullReport ? 180 : 150} stroke={14} />
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
              <span className={`${fullReport ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>{score}%</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-50">SCORE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PillarHeader;
