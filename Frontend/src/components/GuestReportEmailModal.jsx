import React from "react";
import { createPortal } from "react-dom";
import { X, Mail, Loader2, CheckCircle2, FileText } from "lucide-react";

/**
 * The signed-out route to the report PDF.
 *
 * A guest cannot be emailed a report we have no address for, so the download
 * button opens this instead of streaming the file: name and email in, PDF to
 * their inbox, contact details to the backend (POST /single-audit/:id/email-report,
 * stored as a ReportLead). Signed-in users never see it — we already know who
 * they are, so their button downloads directly.
 *
 * Deliberately NOT a download-plus-capture: the PDF arriving by mail is the only
 * reason to type a real address. Hand it over on the spot and the field becomes
 * a formality people fill with "a@a.com".
 */

// Same shape the server enforces, so an obviously-wrong address is caught before
// it costs a request. The server still validates — this is courtesy, not a gate.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function GuestReportEmailModal({ open, onClose, reportId, url, darkMode }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const nameRef = React.useRef(null);

  // Fresh every time it opens — a modal that reopens holding the last person's
  // details is a bug waiting to mail the wrong inbox.
  React.useEffect(() => {
    if (open) {
      setName(""); setEmail(""); setError(""); setSending(false); setSent(false);
      const t = setTimeout(() => nameRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape" && !sending) onClose?.(); };
    window.addEventListener("keydown", onKey);
    // The report page behind this keeps scrolling otherwise, which on mobile
    // means the modal drifts off screen while you are typing into it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, sending, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) return setError("Please enter your name.");
    if (!EMAIL_RE.test(cleanEmail)) return setError("Please enter a valid email address.");

    setError("");
    setSending(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
      const token = localStorage.getItem("dealerpulse_token");
      const response = await fetch(`${API_URL}/single-audit/${reportId}/email-report`, {
        method: "POST",
        // Carries the sessionId cookie so the lead attaches to the visitor's real
        // session rather than minting a fresh, orphaned one.
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: cleanName, email: cleanEmail }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "We could not send that report. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const card = darkMode
    ? "bg-slate-900 border-slate-700 text-slate-100"
    : "bg-card border-line text-ink";
  const field = darkMode
    ? "bg-slate-850 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-orange-500"
    : "bg-cardsoft border-line text-inksoft placeholder-faint focus:border-orange-500";
  const sub = darkMode ? "text-slate-400" : "text-muted";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !sending && onClose?.()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-report-title"
        className={`w-full max-w-md rounded-2xl border shadow-2xl ${card}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-start justify-between gap-4 p-6 pb-4 border-b ${darkMode ? "border-slate-800" : "border-linesoft"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              {sent ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 id="guest-report-title" className="text-base font-bold leading-tight">
                {sent ? "Report on its way" : "Where should we send it?"}
              </h2>
              <p className={`text-xs truncate ${sub}`}>{url}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !sending && onClose?.()}
            aria-label="Close"
            className={`p-1.5 rounded-lg shrink-0 transition-colors ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-surface-2 text-muted"}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 space-y-4">
            {/* "Sending", not "sent": the server hands the mail off to a background
                send and answers immediately, because pushing a ~600 KB attachment
                through SMTP took anywhere from 11 to 85 seconds in testing and the
                visitor should not be watching a spinner for that. */}
            <p className="text-sm leading-relaxed">
              Your full audit report is on its way to <strong className="break-all">{email.trim().toLowerCase()}</strong> as a PDF.
            </p>
            <p className={`text-xs leading-relaxed ${sub}`}>
              It usually arrives within a minute. If it doesn't, check your spam folder — the report is an attachment,
              which some filters hold back.
            </p>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 transition-colors active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4" noValidate>
            <p className={`text-sm leading-relaxed ${sub}`}>
              Tell us where to send the full PDF — the score summary, every issue ranked by impact, and the fix list.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="lead-name" className="block text-xs font-bold uppercase tracking-wider">Your name</label>
              <input
                id="lead-name"
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Jordan Reyes"
                autoComplete="name"
                disabled={sending}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors disabled:opacity-60 ${field}`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lead-email" className="block text-xs font-bold uppercase tracking-wider">Work email</label>
              <input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="jordan@dealership.com"
                autoComplete="email"
                disabled={sending}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors disabled:opacity-60 ${field}`}
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-500" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Building your report…</>
                : <><Mail className="w-4 h-4" /> Email me the report</>}
            </button>

            <p className={`text-[11px] leading-relaxed ${sub}`}>
              We use your details to send this report and to follow up about your website. No spam, and you can ask
              us to delete them at any time.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
