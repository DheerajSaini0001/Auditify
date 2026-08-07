import toast from "react-hot-toast";

/**
 * One completion toast per audit, no matter how many watchers see it land.
 *
 * Three things watch a running audit at the same time: DataContext's poller (it
 * follows the run the user STARTED, wherever they navigate), AuditProgressPanel
 * (it follows the run the user is LOOKING AT), and ReportLayout's own refetch
 * tick. The first two both announced, so a run watched on its own report page
 * produced two "complete" toasts within a second of each other.
 *
 * Keyed by report id and remembered for the life of the tab, so re-opening a
 * finished report cannot re-announce a result the user was already told about.
 */
const announced = new Set();

/**
 * Announce a terminal audit exactly once.
 *
 * `status` must be the RAW backend status ("completed" / "failed") or the
 * normalized one ("success" / "failed") — anything non-terminal is ignored, so a
 * caller can hand this every poll tick without gating first.
 *
 * Returns true if this call is the one that spoke.
 */
export const announceAuditFinished = (id, status) => {
  const key = id == null ? "" : String(id);
  const isDone = status === "completed" || status === "success";
  const isFailed = status === "failed";
  if (!key || (!isDone && !isFailed)) return false;
  if (announced.has(key)) return false;
  announced.add(key);

  if (isFailed) toast.error("Audit run failed.");
  else toast.success("Audit complete!");
  return true;
};

/**
 * Forget an id so it can announce again — for a forced re-run, which reuses the
 * URL but gets a new report id anyway. Exported for completeness; nothing needs
 * it today.
 */
export const resetAuditAnnouncement = (id) => {
  announced.delete(id == null ? "" : String(id));
};
