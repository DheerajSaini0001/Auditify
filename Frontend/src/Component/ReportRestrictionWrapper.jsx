import React from "react";

/**
 * ReportRestrictionWrapper
 *
 * Previously this hid report content behind a LoginOverlay for unauthenticated
 * users. Guests now verify their email via OTP before an audit runs (see
 * AuditEmailVerifyModal) and are allowed to view the resulting report, so this is
 * now a transparent pass-through.
 *
 * Kept as a wrapper (rather than deleting it from the ~8 report/section pages that
 * import it) so the gate can be restored in one place if that policy changes.
 */
const ReportRestrictionWrapper = ({ children }) => <>{children}</>;

export default ReportRestrictionWrapper;
