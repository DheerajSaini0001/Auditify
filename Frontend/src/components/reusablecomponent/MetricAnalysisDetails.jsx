import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

// Each backend meta list gets a header that names the actual problem and a plain-English
// line on why it matters. Only the lists present in a card's meta render, so each card
// shows just its own sections (e.g. Compression → "Files Served Uncompressed").
const RESOURCE_SECTIONS = [
    {
        key: 'uncompressedResources',
        title: 'Files Served Uncompressed',
        note: 'These files travel over the network at full size. Serving them with gzip or Brotli compression typically cuts the transfer by 60–80% with a one-time server/CDN setting — no code changes. Files on third-party domains must be fixed by that vendor.',
    },
    {
        key: 'uncachedResources',
        title: 'Files Re-downloaded on Every Visit',
        note: 'These files have no (or a too-short) caching policy, so returning visitors download them again instead of reusing the copy already on their device. Add a long Cache-Control max-age to make repeat visits feel instant.',
    },
    {
        key: 'unoptimizedImages',
        title: 'Images Larger Than They Display',
        note: 'Each image ships at a much higher resolution than the size it is shown at (see the Displayed vs Natural dimensions). Resize or serve responsive sizes to stop sending wasted pixels.',
    },
    {
        key: 'unminifiedScripts',
        title: 'Scripts Not Minified',
        note: 'These scripts still contain whitespace, comments and long variable names. Minifying them shrinks the download and speeds up parsing on phones.',
    },
    {
        key: 'blockingResources',
        title: 'Files Blocking First Paint',
        note: 'The browser must fully download these before it can draw anything, so the visitor stares at a blank screen meanwhile. Defer non-critical scripts and inline or split critical CSS.',
    },
];

const MetricAnalysisDetails = ({ analysis, meta, status, darkMode, isOpen, onToggle, fallbackCauses, fallbackRecommendations }) => {
    if (!isOpen) return null;

    // Fall back to static InfoDetails arrays when backend analysis is absent — but never
    // on a passing card (its panel may be open just to list its resources, and the
    // static lists describe failure reasons that don't apply).
    const isFailing = status !== "pass";
    const causes = (analysis?.causes?.length > 0 || analysis?.cause) || !isFailing
        ? null
        : (Array.isArray(fallbackCauses) && fallbackCauses.length > 0 ? fallbackCauses : null);
    const recommendations = (analysis?.recommendations?.length > 0 || analysis?.recommendation) || !isFailing
        ? null
        : (Array.isArray(fallbackRecommendations) && fallbackRecommendations.length > 0 ? fallbackRecommendations : null);

    // When the panel renders detailed per-file sections (each with a problem-naming header,
    // the offending files and a fix note), the Causes/Recommendations lists would only
    // restate the same counts and advice — skip them and let the sections speak.
    const hasDetailedSections =
        RESOURCE_SECTIONS.some((s) => meta?.[s.key]?.length > 0) || meta?.redirectDetails?.length > 1;

    // Shared readable text colours — the panel used to stack 10px type with grey +
    // opacity, which was hard to read.
    const bodyText = darkMode ? "text-gray-200" : "text-inksoft";
    const subText = darkMode ? "text-gray-400" : "text-muted";

    return (
        <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-line"}`}>
            <div className="space-y-4">
                {analysis?.lcpElement && (
                    <div>
                        <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-ink"}`}>LCP Element</h5>
                        <div className={`text-sm p-2.5 rounded-md font-mono break-all ${darkMode ? "bg-slate-900/50 text-slate-200 border border-slate-800" : "bg-cardsoft text-inksoft border border-line"}`}>
                            {analysis.lcpElement}
                        </div>
                    </div>
                )}
                {!hasDetailedSections && (analysis?.causes?.length > 0 || analysis?.cause || causes) && (
                    <div>
                        <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-rose-400" : "text-rose-600"}`}>Causes</h5>
                        <ul className="space-y-2">
                            {/* `causes` is the complete list and already contains `cause` (its first
                                entry, kept for PDF/legacy consumers) — render one or the other. */}
                            {analysis?.cause && !(analysis?.causes?.length > 0) && (
                                <li className={`text-sm flex items-start gap-2 ${bodyText}`}>
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{analysis.cause}</span>
                                </li>
                            )}
                            {analysis?.causes?.map((cause, idx) => (
                                <li key={idx} className={`text-sm flex items-start gap-2 ${bodyText}`}>
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{cause}</span>
                                </li>
                            ))}
                            {causes?.map((cause, idx) => (
                                <li key={idx} className={`text-sm flex items-start gap-2 ${bodyText}`}>
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span>{cause}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {!hasDetailedSections && (analysis?.recommendations?.length > 0 || analysis?.recommendation || recommendations) && (
                    <div>
                        <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>Recommendations</h5>
                        <ul className="space-y-2">
                            {analysis?.recommendation && !(analysis?.recommendations?.length > 0) && (
                                <li className={`text-sm flex items-start gap-2 ${bodyText}`}>
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{analysis.recommendation}</span>
                                </li>
                            )}
                            {analysis?.recommendations?.map((rec, idx) => (
                                <li key={idx} className={`text-sm flex items-start gap-2 ${bodyText}`}>
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                            {recommendations?.map((rec, idx) => (
                                <li key={idx} className={`text-sm flex items-start gap-2 ${bodyText}`}>
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Redirect chain — an ordered path (each URL forwards to the next), not a
                    list of broken resources, so it gets step-by-step rendering. */}
                {meta?.redirectDetails?.length > 1 && (
                    <div className="pt-2">
                        <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-ink"}`}>
                            Redirect Path ({meta.redirectDetails.length - 1} {meta.redirectDetails.length === 2 ? "hop" : "hops"})
                        </h5>
                        <div className={`space-y-2 rounded-lg p-3 ${darkMode ? "bg-slate-900/30" : "bg-cardsoft"}`}>
                            {meta.redirectDetails.map((u, idx, arr) => {
                                const isFinal = idx === arr.length - 1;
                                return (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${isFinal ? (darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600") : (darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-600")}`}>{idx + 1}</span>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-mono break-all ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{u}</p>
                                            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isFinal ? (darkMode ? "text-emerald-400" : "text-emerald-600") : (darkMode ? "text-amber-400" : "text-amber-600")}`}>
                                                {idx === 0 ? "Requested URL — redirects to ↓" : isFinal ? "Final destination (loads here)" : "Intermediate redirect ↓"}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className={`mt-2 text-xs leading-relaxed ${subText}`}>
                            Every hop adds a round-trip before the page starts loading. Point links, ads and bookmarks at the final URL to skip the detour.
                        </p>
                    </div>
                )}

                {/* Per-check resource lists. Each list gets a header that says what is wrong
                    with the files in it and a one-liner on why it matters, instead of a
                    generic "Affected Resources" dump. */}
                {RESOURCE_SECTIONS.map(({ key, title, note }) => {
                    const items = meta?.[key];
                    if (!items?.length) return null;
                    return (
                        <div key={key} className="pt-2">
                            <h5 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? "text-blue-400" : "text-ink"}`}>
                                {title} ({items.length})
                            </h5>
                            <div className={`max-h-64 overflow-y-auto space-y-2 rounded-lg p-2 ${darkMode ? "bg-slate-900/30" : "bg-cardsoft"}`}>
                                {items.map((item, idx) => {
                                    const url = typeof item === 'string' ? item : item?.url;
                                    const details = typeof item === 'object' ? item?.details : null;
                                    return (
                                        <div key={idx} className={`text-xs p-2.5 rounded border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-card border-line"}`}>
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <a href={url} target="_blank" rel="noopener noreferrer" className={`font-mono break-all flex-grow hover:underline ${darkMode ? "text-gray-200" : "text-inksoft"}`}>{url}</a>
                                                {item?.type && (
                                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${item.type === 'Image' ? (darkMode ? "bg-purple-900/30 text-purple-400" : "bg-purple-50 text-purple-600") : (darkMode ? "bg-amber-900/30 text-amber-400" : "bg-amber-50 text-amber-600")}`}>
                                                        {item.type}
                                                    </span>
                                                )}
                                            </div>
                                            {details && <p className={subText}>{details}</p>}
                                            {item?.currentEncoding && <p className={`mt-1 ${subText}`}>Encoding: {item.currentEncoding}</p>}
                                            {item?.cachePolicy && <p className={`mt-1 ${subText}`}>Policy: {item.cachePolicy}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className={`mt-2 text-xs leading-relaxed ${subText}`}>{note}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MetricAnalysisDetails;
