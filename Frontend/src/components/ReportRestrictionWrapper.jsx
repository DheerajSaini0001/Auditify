import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { savePostAuthIntent } from "../utils/intentStore";
import {
  isSectionGated,
  sectionHasReported,
  GATE_HEADLINE,
  GATE_BODY,
} from "../config/gatedSections.js";

/**
 * Filler that sits behind the blur. Roughly the shape of a findings list — a few
 * metric rows with a status chip and a couple of lines of text — so the gate reads
 * as "there is real content here" rather than as a broken panel. Intentionally
 * meaningless: it must never imply a score or a verdict the audit did not produce.
 */
const GatedPreview = () => (
  <div className="space-y-4 pt-2">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl border border-line bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-44 rounded bg-surface-2" />
          <div className="h-6 w-20 rounded-full bg-accentsoft" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-surface-2" />
          <div className="h-3 w-11/12 rounded bg-surface-2" />
          <div className="h-3 w-2/3 rounded bg-surface-2" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * ReportRestrictionWrapper
 *
 * Wraps the *detail* of a report section. For a signed-in user, or for a section
 * on the free list, it is a transparent pass-through. For a signed-out visitor on
 * a gated section it shows the content blurred behind an unlock prompt.
 *
 * Callers must pass `section` — the canonical section name (see
 * config/gatedSections.js). It is deliberately NOT derived from the route: in a
 * custom-subset report every selected section renders inline under /report/:id,
 * so route sniffing would leave those ungated.
 *
 * The blur is a teaser, not a lock. The payload for a signed-out request is
 * already stripped server-side (Backend/utils/reportGating.js); this makes that
 * absence look deliberate instead of broken.
 */
const ReportRestrictionWrapper = ({ children, section }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { data } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  // While auth is resolving, render nothing rather than flashing the gate at a
  // user who turns out to be signed in.
  if (isLoading) return null;

  const gated = !isAuthenticated && isSectionGated(section);
  if (!gated) return <>{children}</>;

  // The audit is still running and this pillar has not reported yet — so there is
  // nothing behind the blur to unlock. Rendering the gate now puts "Sign up free to
  // see this" directly under the section's own "PROCESSING" shimmer, telling the
  // visitor their findings are paywalled before those findings exist. Stay out of
  // the way until the section actually lands; the shimmer above owns the wait.
  if (!sectionHasReported(data, section)) return null;

  // Send them back to exactly this report once they have an account.
  const goTo = (path) => {
    const returnTo = location.pathname + location.search;
    savePostAuthIntent(data?._id || "temp", returnTo);
    navigate(path, { state: { from: returnTo } });
  };

  return (
    <div className="relative">
      {/*
        Deliberately NOT `children`. The server does not send gated section detail
        to a signed-out request, so the real components would be rendering an empty
        object — blank rows at best, a crash at worst. This is a stand-in whose only
        job is to be the right shape behind a blur.

        `aria-hidden` keeps this decorative filler out of the accessibility tree;
        there is nothing interactive in it to trap focus.
      */}
      <div className="max-h-[420px] overflow-hidden blur-[6px] select-none" aria-hidden="true">
        <GatedPreview />
      </div>

      {/* Fade so the clipped content ends deliberately rather than mid-sentence. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-surface pointer-events-none"
      />

      <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-8">
        <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-xl p-7 text-center">
          <div className="mx-auto mb-4 w-11 h-11 rounded-xl bg-accentsoft flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">{GATE_HEADLINE}</h3>
          <p className="text-sm text-muted leading-relaxed mb-6">{GATE_BODY}</p>
          <button
            type="button"
            onClick={() => goTo("/register")}
            className="w-full h-11 rounded-xl bg-accent hover:bg-accenthover text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            Create free account <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => goTo("/login")}
            className="mt-3 text-sm font-semibold text-muted hover:text-ink transition-colors"
          >
            Already have an account? <span className="text-accent">Sign in</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportRestrictionWrapper;
