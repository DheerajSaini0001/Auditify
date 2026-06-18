const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak,
} = require("docx");

const NAVY = "1F3864";
const BLUE = "2E75B6";
const LIGHT = "D9E2F3";
const GREY = "595959";
const HDR_FILL = "1F3864";

const CONTENT_W = 9360;

const border = { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, w) {
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA }, margins: cellMargins,
    shading: { fill: HDR_FILL, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 19 })] })],
  });
}
function bodyCell(runs, w, fill) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: String(runs), size: 19 })];
  return new TableCell({
    borders, width: { size: w, type: WidthType.DXA }, margins: cellMargins,
    ...(fill ? { shading: { fill, type: ShadingType.CLEAR } } : {}),
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children })],
  });
}

function table(widths, headerLabels, rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headerLabels.map((l, i) => headerCell(l, widths[i])),
  });
  const bodyRows = rows.map((r, ri) =>
    new TableRow({
      children: r.map((c, i) => bodyCell(c, widths[i], ri % 2 ? "F2F5FB" : undefined)),
    })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...bodyRows],
  });
}

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const P = (runs, opts = {}) =>
  new Paragraph({ spacing: { after: 120 }, ...opts,
    children: Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22 })] });
const bullet = (runs) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
    children: Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22 })] });
const code = (t) =>
  new Paragraph({ spacing: { after: 60 }, shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
    children: [new TextRun({ text: t, font: "Consolas", size: 18 })] });
const b = (t) => new TextRun({ text: t, bold: true, size: 22 });
const r = (t) => new TextRun({ text: t, size: 22 });

const doc = new Document({
  creator: "Auditify",
  title: "Work Log — 10 June 2026",
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: "222222" } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal",
        run: { size: 56, bold: true, color: NAVY, font: "Arial" },
        paragraph: { spacing: { after: 80 } } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: NAVY, font: "Arial" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: BLUE, font: "Arial" },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 4 } },
        children: [
          new TextRun({ text: "Auditify — Development Work Log", color: GREY, size: 16 }),
          new TextRun({ text: "\tDheeraj Saini", color: GREY, size: 16 }),
        ] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        children: [
          new TextRun({ text: "Confidential", color: GREY, size: 16 }),
          new TextRun({ text: "\tPage ", color: GREY, size: 16 }),
          new TextRun({ children: [PageNumber.CURRENT], color: GREY, size: 16 }),
          new TextRun({ text: " of ", color: GREY, size: 16 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: GREY, size: 16 }),
        ] })] }),
    },
    children: [
      new Paragraph({ style: "Title", spacing: { before: 2200, after: 80 },
        children: [new TextRun("Daily Work Log")] }),
      new Paragraph({ spacing: { after: 40 },
        children: [new TextRun({ text: "Auditify — Dealership Website Audit Platform", size: 26, color: BLUE })] }),
      new Paragraph({ spacing: { after: 600 },
        children: [new TextRun({ text: "Work performed on Wednesday, 10 June 2026", size: 22, italics: true, color: GREY })] }),

      table([3120, 6240], ["Field", "Detail"], [
        ["Date", "Wednesday, 10 June 2026"],
        ["Author", "Dheeraj Saini"],
        ["Branch", "sec"],
        ["Commits", "2  (9c7ef5d5, 425de4e3)"],
        ["Focus areas", "Security hardening; Core Web Vitals (FID) + dealership page-speed metrics"],
        ["Prepared", "11 June 2026"],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      new Paragraph({ spacing: { after: 120 },
        children: [new TextRun({ text: "Contents", bold: true, size: 28, color: NAVY })] }),
      new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------- Summary ----------
      H1("1.  Summary"),
      P([r("Two pieces of work shipped on 10 June 2026, on the "), b("sec"), r(" branch:")]),
      bullet([b("Security remediation pass "), r("(commit 9c7ef5d5, “Heacker prevented”) — a broad fix of critical and high-severity vulnerabilities across authentication, rate limiting, SSRF protection, secret handling and output encoding, plus a written remediation guide.")]),
      bullet([b("Performance metrics "), r("(commit 425de4e3) — added First Input Delay (FID) scoring and new dealership-specific timed page-load checks for vehicle inventory and service pages, with matching frontend display.")]),

      // ---------- Security ----------
      H1("2.  Security Remediation (commit 9c7ef5d5)"),
      P("A platform-wide security review was acted on. Code-level critical and high issues were fixed in the working tree; a companion document, SECURITY_REMEDIATION.md, records the operational follow-ups (secret rotation, history scrubbing, dependency upgrades) that require manual action."),

      H2("2.1  Critical fixes"),
      table([2400, 3380, 3580],
        ["Area", "Issue", "Fix"],
        [
          ["SSRF", "Hostname blocklist was easily bypassed (string checks only).", "New DNS-resolving guard utils/ssrfGuard.js blocks private / reserved / loopback / link-local ranges, the cloud-metadata IP (169.254.169.254), decimal / hex / IPv6 / IPv4-mapped encodings, embedded credentials and non-http(s) schemes."],
          ["Auth on AI/AEO", "/api/ai/* and /api/aeo/* were unauthenticated — open to billing / LLM abuse and resource drain.", "Added rate limiters plus tryAuthenticate so abuse is bounded and per-user ownership applies."],
          ["IDOR", "AEO report could be read by any user (getAEOReport).", "Fails closed: 401 without a user; query scoped to the owner otherwise."],
          ["Encryption key", "AES key had a hardcoded fallback committed in source.", "Removed; the app refuses to start without a valid CONFIG_ENCRYPTION_KEY (64-hex validation)."],
        ]),

      H2("2.2  High-severity fixes"),
      table([2400, 3380, 3580],
        ["Area", "Issue", "Fix"],
        [
          ["Profile leak", "updateProfile returned the password hash and OAuth tokens.", "Returns only whitelisted safe fields; validates name."],
          ["Rate limit", "Single-audit limit was max: 500000 (each audit spawns a Chromium worker).", "Set to 20 per 15 minutes."],
          ["Blocked users", "isBlocked flag was never enforced.", "Blocked users rejected at login and in verifyToken, which now also refreshes the role from the DB (fixes stale-role tokens)."],
          ["Regex injection", "Admin search allowed $regex injection / ReDoS.", "User input escaped before building the regex."],
          ["Stored XSS in PDF", "Scanned-site content was rendered by headless Chromium in the PDF.", "Every dynamic value (URL, details, cause, recommendation, section names) is HTML-escaped."],
          ["Screenshot SSRF", "Screenshot endpoint had no SSRF check and no ownership check.", "Added SSRF validation plus owner / admin check."],
          ["Auth brute force", "Auth endpoints had no rate limiting; the existing authLimiter was never applied.", "Per-IP limiters: login 10/15m, password reset 5/15m, register 10/h, OTP 20/15m, plus a global 300/15m backstop on state-changing requests (GET polling skipped)."],
        ]),

      H2("2.3  Medium-severity fixes"),
      bullet([b("OTP generation "), r("— replaced Math.random() with crypto.randomInt (utils/generateOTP.js).")]),
      bullet([b("Session cookie "), r("— secure flag now gated on NODE_ENV=production; the guessable SESSION_SECRET fallback (“secret_2026”) removed — the server refuses to start without a strong secret (server.js).")]),
      bullet([b("adminAuth placeholder "), r("— a no-op middleware that authorized everyone now fails closed (501) if ever mounted (middleware/adminAuth.js).")]),

      H2("2.4  Operational follow-ups (manual — documented in SECURITY_REMEDIATION.md)"),
      P("These touch live credentials, git history and dependency installs, so they were documented rather than auto-applied:"),
      bullet([b("Rotate leaked secrets "), r("— Backend/.env was committed in earlier history; every secret it ever held (MONGO_URI, Google API keys, GEMINI_API_KEY, VirusTotal, OAuth secret, SMTP password, JWT/SESSION secrets, encryption key) must be rotated.")]),
      bullet([b("Scrub git history "), r("— remove .env from history with git filter-repo / BFG, then force-push and have collaborators re-clone.")]),
      bullet([b("Upgrade vulnerable dependencies "), r("— axios, mongoose (backend); jspdf, jspdf-autotable, react-router-dom (frontend), then smoke-test PDF export and routing.")]),

      H2("2.5  Verification"),
      bullet("SSRF guard unit-tested against 20+ bypass cases (metadata IP, decimal/hex/IPv6/IPv4-mapped encodings, credentials trick, non-http schemes) — all blocked; public IPs allowed."),
      bullet("All 15 modified backend files pass node --check; runtime import smoke test passes."),
      bullet("The frontend markdown → dangerouslySetInnerHTML path was reviewed and confirmed not XSS-exploitable (input escaped before any tags are added)."),

      new Paragraph({ children: [new PageBreak()] }),

      // ---------- Performance ----------
      H1("3.  Performance Metrics (commit 425de4e3)"),
      P("New scoring logic in Backend/metricServices/technicalMetrics.js, with matching display in the Technical Performance page and supporting components."),

      H2("3.1  First Input Delay (FID)"),
      bullet([b("Lab variant "), r("— evaluateFIDLab reads Lighthouse’s max-potential-fid (worst-case input delay). Thresholds: Good 0–130 ms, Warning 130–250 ms, Poor 250 ms+. This keeps the FID card populated now that Google removed real-user FID from CrUX (replaced by INP, Sept 2024).")]),
      bullet([b("Field variant "), r("— evaluateFIDCrux reads FIRST_INPUT_DELAY_MS from CrUX when present (Good 0–100 ms, Warning 100–300 ms, Poor 300 ms+); returns null otherwise so the card falls back to the lab value.")]),
      bullet([b("Diagnostics "), r("— when failing, both surface likely causes and recommendations drawn from long-tasks, JS bootup time and third-party scripts.")]),

      H2("3.2  Timed page-load checks (inventory & service pages)"),
      P("Dealership-specific checks that find a key page, open it in its own browser tab (never the shared audit page), and time it from navigation start to window.onload."),
      bullet([b("Page discovery "), r("— sitemap.xml (including sitemap indexes) first, then links crawled from the already-rendered homepage.")]),
      bullet([b("Inventory ranking "), r("— rankInventoryPath scores paths: used / pre-owned inventory (3) preferred, new inventory (2), generic inventory / SRP / showroom (1).")]),
      bullet([b("Service ranking "), r("— rankServicePath scores: schedule / appointment (3), main service department (2), service-adjacent (1); “customer-service” support pages explicitly excluded.")]),
      bullet([r("Navigation timeout set to 45 s; fetches use an AbortController-based timeout and a realistic browser User-Agent.")]),

      H2("3.3  Frontend"),
      bullet("Technical_Performance.jsx — surfaces the new FID and timed page-load metrics."),
      bullet("InfoDetails.jsx and reusablecomponent/StatusSummary.jsx — updated to display the new parameters and their pass / warning / fail status."),

      // ---------- Files ----------
      H1("4.  Files Changed"),
      H2("Commit 9c7ef5d5 — Security"),
      table([5400, 3960], ["File", "Change"], [
        ["utils/ssrfGuard.js", "New DNS-resolving SSRF guard"],
        ["middleware/rateLimiter.js", "Purpose-specific + global IP limiters"],
        ["middleware/auth.js", "DB re-check; role refresh; block enforcement"],
        ["middleware/adminAuth.js", "Fail-closed (501)"],
        ["controllers/authController.js", "Reject blocked users at login"],
        ["controllers/userController.js", "Whitelist profile response fields"],
        ["controllers/adminController.js", "Escape regex input"],
        ["controllers/pdfController.js", "HTML-escape dynamic PDF content"],
        ["controllers/singleAuditController.js", "SSRF + ownership on screenshot"],
        ["controllers/aeoController.js", "SSRF guard; IDOR fix"],
        ["routes/authRoutes.js, aeoRoutes.js, aiExplainRoutes.js, singleAuditRoutes.js", "Apply limiters / auth"],
        ["utils/encryption.js", "Require valid encryption key"],
        ["utils/generateOTP.js", "crypto.randomInt"],
        ["server.js", "Strong SESSION_SECRET; secure cookie; global limiter"],
        ["SECURITY_REMEDIATION.md", "New remediation guide"],
      ]),
      H2("Commit 425de4e3 — Performance"),
      table([5400, 3960], ["File", "Change"], [
        ["metricServices/technicalMetrics.js", "FID (lab + field); timed inventory / service page loads"],
        ["Frontend/src/Pages/Technical_Performance.jsx", "Display new metrics"],
        ["Frontend/src/Component/InfoDetails.jsx", "Parameter details"],
        ["Frontend/src/Component/reusablecomponent/StatusSummary.jsx", "Status summary updates"],
      ]),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Work Log - 10 June 2026.docx", buf);
  console.log("written", buf.length, "bytes");
});
