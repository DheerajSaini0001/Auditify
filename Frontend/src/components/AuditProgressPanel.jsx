import React, { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { CheckCircle2, Clock, Loader2, Mail, Users } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";

/**
 * The waiting room for a running audit.
 *
 * A single-page run finishes while the visitor watches, so this is just a progress
 * bar. A multi-page run takes minutes — long enough that holding someone on a
 * spinner is the wrong thing to do — so after a short grace period this switches
 * to telling them they can leave, because the report will be emailed.
 *
 * The grace period exists so the panel does not open with "go away": a run that
 * hits a cached result, or a fast site, finishes inside it and the visitor never
 * sees the message at all.
 */
const WALK_AWAY_AFTER_MS = 12000;
const POLL_MS = 3000;

/** Seconds → something a person would actually say. */
const formatEta = (seconds) => {
    if (seconds == null) return null;
    if (seconds <= 45) return "under a minute";
    const minutes = Math.round(seconds / 60);
    return minutes <= 1 ? "about a minute" : `about ${minutes} minutes`;
};

const AuditProgressPanel = ({ reportId, notifyEmail: notifyEmailProp = null, onComplete }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";

    const [status, setStatus] = useState(null);
    const [walkAway, setWalkAway] = useState(false);
    const announced = useRef(false);

    // Grace period before we suggest leaving — see WALK_AWAY_AFTER_MS.
    useEffect(() => {
        const t = setTimeout(() => setWalkAway(true), WALK_AWAY_AFTER_MS);
        return () => clearTimeout(t);
    }, [reportId]);

    useEffect(() => {
        if (!reportId) return undefined;
        let cancelled = false;
        let timer;

        const poll = async () => {
            try {
                const token = localStorage.getItem("dealerpulse_token");
                const res = await fetch(`${API_URL}/single-audit/${reportId}/status`, {
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;

                setStatus(data);

                if (data.status === "completed" && !announced.current) {
                    announced.current = true;
                    toast.success("Your audit has been completed successfully.", { duration: 6000 });
                    onComplete?.(data);
                    return; // terminal — stop polling
                }
                if (data.status === "failed" && !announced.current) {
                    announced.current = true;
                    return;
                }
                timer = setTimeout(poll, POLL_MS);
            } catch {
                // Transient network blip — keep trying, the audit is still running.
                if (!cancelled) timer = setTimeout(poll, POLL_MS);
            }
        };

        poll();
        return () => { cancelled = true; clearTimeout(timer); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId]);

    if (!status || status.status === "completed" || status.status === "failed") return null;

    const progress = Math.max(0, Math.min(100, status.progress ?? 0));
    const eta = formatEta(status.estimatedSecondsRemaining);
    const notifyEmail = status.notifyEmail || notifyEmailProp;
    const isLongRun = (status.plannedPages || 1) > 1 || !!notifyEmail;
    const showWalkAway = walkAway && isLongRun;

    return (
        <div className={`rounded-2xl border p-6 sm:p-7 mb-6 transition-colors duration-300
            ${darkMode ? "bg-slate-900 border-slate-800" : "bg-card border-line"}`}>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <Loader2 size={18} className="animate-spin text-accent shrink-0" />
                    <h2 className={`font-black text-base tracking-tight truncate ${darkMode ? "text-white" : "text-ink"}`}>
                        {status.message || "Running your audit"}
                    </h2>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {eta && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${darkMode ? "text-slate-400" : "text-muted"}`}>
                            <Clock size={13} />
                            Estimated time: {eta}
                        </span>
                    )}
                    <span className={`text-sm font-black tabular-nums ${darkMode ? "text-white" : "text-ink"}`}>
                        {progress}%
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className={`mt-4 h-2 w-full rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-surface-2"}`}>
                <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${darkMode ? "text-slate-500" : "text-faint"}`}>
                <span>{progress}% complete</span>
                {status.totalSections > 0 && (
                    <span>{status.completedSections}/{status.totalSections} sections scored</span>
                )}
                {status.queuePosition > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                        <Users size={12} />
                        #{status.queuePosition} in queue
                    </span>
                )}
            </div>

            {/* After the grace period, a long run stops asking the visitor to wait. */}
            {showWalkAway && (
                <div className={`mt-5 rounded-xl border p-4 flex items-start gap-3
                    ${darkMode ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50 border-emerald-100"}`}>
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-ink"}`}>
                            You asked for a full audit — this one takes a few minutes.
                        </p>
                        <p className={`text-sm mt-1 leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                            Your audit is in the queue and running. You do not have to sit here — close the tab
                            and take a break.
                            {notifyEmail ? (
                                <>
                                    {" "}We will email <span className="font-semibold inline-flex items-center gap-1">
                                        <Mail size={12} />{notifyEmail}
                                    </span> the moment it is done.
                                </>
                            ) : (
                                " We will notify you as soon as it is done."
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditProgressPanel;
