/**
 * One name for the exported audit PDF, wherever the download button lives.
 *
 * The export endpoint already names the file in `Content-Disposition`
 * (Backend/utils/reportPdfTemplate.js#reportFileName), and app.js exposes that
 * header through CORS — so the server is the single source of truth and the four
 * download buttons no longer each invent their own name.
 *
 * The fallback matters: an older backend, or a same-origin proxy that drops the
 * header, must still produce a sensible file rather than "download.pdf".
 */

const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch {
    return String(url || "")
      .replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
};

export const pdfFileNameFrom = (response, url, createdAt) => {
  const header = response?.headers?.get?.("content-disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (match?.[1]) {
    try { return decodeURIComponent(match[1].trim()); }
    catch { return match[1].trim(); }
  }

  const day = createdAt ? new Date(createdAt) : new Date();
  const date = Number.isNaN(day.getTime()) ? new Date() : day;
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const slug = hostOf(url).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "report";
  return `DealerSiteAudit-${slug}-${stamp}.pdf`;
};
