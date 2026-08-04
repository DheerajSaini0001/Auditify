/**
 * reportGating — what a signed-out visitor is allowed to receive.
 *
 * The frontend blurs gated sections behind a sign-up prompt, but a blur is paint:
 * the data still sits in the DOM and in the network tab, so on its own it is a
 * paywall that DevTools defeats in seconds. This strips the gated sections out of
 * the payload before it ever leaves the server, which is the actual gate. The blur
 * exists to make that absence look deliberate rather than broken.
 *
 * Scores survive. Every pillar keeps its Percentage and Grade so a guest still
 * sees the full picture — eight rings, eight numbers — and only the detail behind
 * the gated pillars is withheld. That is the hook: you can see what is wrong, you
 * sign up to find out why and how to fix it.
 *
 * Keys must stay in sync with FREE_SECTIONS / GATED_SECTIONS in
 * Frontend/src/config/gatedSections.js. Those are display names; these are the
 * schema keys they correspond to.
 */

// securityOrCompliance / UXOrContentStructure / conversionAndLeadFlow / aioReadiness / aeo
// map to the five gated display names. technicalPerformance, onPageSEO and
// accessibility are free and are never touched.
const GATED_SECTION_KEYS = [
  "securityOrCompliance",
  "UXOrContentStructure",
  "conversionAndLeadFlow",
  "aioReadiness",
  "aeo",
];

// Kept from a gated section so the score UI still renders.
const PRESERVED_FIELDS = ["Percentage", "Grade"];

/**
 * Aggregate pass/warn/fail tallies for a section.
 *
 * Mirrors how the section pages count client-side (every direct child object that
 * carries a `status`), because those pages show "N Passed · N Failed" in a header
 * that sits OUTSIDE the gated area. Without these, stripping the detail left that
 * header reading "0 Passed · 0 Failed" next to an 81% score — which is not just
 * ugly, it is wrong.
 *
 * Counts are a legitimate teaser: they say how much there is to fix without saying
 * what it is. Per-metric statuses are deliberately NOT preserved — knowing that
 * three checks failed is a hook, knowing *which three* is most of the answer.
 */
const tallyStatuses = (section) => {
  const withStatus = (obj) =>
    Object.values(obj || {}).filter(
      (v) => typeof v === "object" && v !== null && "status" in v
    );

  // Most sections hang their metrics off the section itself. AEO nests them under
  // `params`, so counting only direct children reported 0 Passed / 0 Failed next to
  // a real score. Fall back rather than special-casing the key, so any section that
  // adopts the same shape is handled too.
  let metrics = withStatus(section);
  if (metrics.length === 0) metrics = withStatus(section.params);
  return {
    passedCount: metrics.filter((m) => m.status === "pass").length,
    warningCount: metrics.filter((m) => m.status === "warning").length,
    failedCount: metrics.filter((m) => m.status === "fail").length,
  };
};

/**
 * @param {object} doc      Mongoose document or plain object from auditStore.
 * @param {boolean} isAuthed Whether the requester is signed in.
 * @returns {object} A safe-to-send plain object.
 */
export const gateReportForViewer = (doc, isAuthed) => {
  if (!doc) return doc;
  // Signed-in users get everything. Gating is about accounts, not roles.
  if (isAuthed) return doc;

  // auditStore holds plain objects; Mongo hands back documents.
  const plain = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  for (const key of GATED_SECTION_KEYS) {
    const section = plain[key];
    if (!section || typeof section !== "object") continue;

    const kept = { locked: true, ...tallyStatuses(section) };
    for (const field of PRESERVED_FIELDS) {
      if (section[field] !== undefined) kept[field] = section[field];
    }
    plain[key] = kept;
  }

  return plain;
};

export { GATED_SECTION_KEYS };
