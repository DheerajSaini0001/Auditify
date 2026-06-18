#!/usr/bin/env python3
"""Generate a detailed, designed SEO parameter implementation PDF for Auditify."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable, Flowable, KeepTogether
)

OUT = "/Users/dheeraj/Desktop/Auditify/SEO_Parameter_Implementation.pdf"
DATE = "12 June 2026"

# ---------- palette ----------
NAVY = colors.HexColor("#0f172a")
SLATE = colors.HexColor("#1e293b")
BLUE = colors.HexColor("#2563eb")
BLUEDK = colors.HexColor("#1d4ed8")
INDIGO = colors.HexColor("#4338ca")
GREEN = colors.HexColor("#059669")
GREENBG = colors.HexColor("#ecfdf5")
AMBER = colors.HexColor("#d97706")
AMBERBG = colors.HexColor("#fffbeb")
RED = colors.HexColor("#dc2626")
REDBG = colors.HexColor("#fef2f2")
GREY = colors.HexColor("#64748b")
GREYLT = colors.HexColor("#94a3b8")
LIGHT = colors.HexColor("#f1f5f9")
LIGHTBLUE = colors.HexColor("#eff6ff")
BORDER = colors.HexColor("#cbd5e1")
BORDERLT = colors.HexColor("#e2e8f0")
TEAL = colors.HexColor("#0d9488")

CONTENT_W = 170 * mm  # A4 width (210) minus 2x20mm margins

styles = getSampleStyleSheet()

H_TITLE = ParagraphStyle("HTitle", parent=styles["Title"], fontSize=30,
                         textColor=colors.white, spaceAfter=4, leading=34, alignment=TA_LEFT)
H_SUB = ParagraphStyle("HSub", parent=styles["Normal"], fontSize=12,
                       textColor=colors.HexColor("#cbd5e1"), spaceAfter=2,
                       alignment=TA_LEFT, leading=16)
H_SECTION = ParagraphStyle("HSection", parent=styles["Heading1"], fontSize=15,
                           textColor=BLUE, spaceBefore=14, spaceAfter=6, leading=20)
H_PARAM = ParagraphStyle("HParam", parent=styles["Heading2"], fontSize=12,
                         textColor=NAVY, spaceBefore=10, spaceAfter=2, leading=15)
META = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=8.5,
                      textColor=GREY, spaceAfter=4, leading=11)
BODY = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.5,
                      leading=13.5, spaceAfter=4)
BODYW = ParagraphStyle("BodyW", parent=BODY, textColor=colors.white)
BULLET = ParagraphStyle("Bullet", parent=styles["Normal"], fontSize=9.5,
                        leading=13, spaceAfter=1)
CODE = ParagraphStyle("Code", parent=styles["Code"], fontSize=8.2,
                      textColor=NAVY, backColor=LIGHT, leading=11,
                      borderPadding=6, spaceBefore=2, spaceAfter=6,
                      borderWidth=0.5, borderColor=BORDER)
TOCITEM = ParagraphStyle("TOC", parent=styles["Normal"], fontSize=10.5,
                         textColor=SLATE, leading=20)
CARDLABEL = ParagraphStyle("CardLabel", parent=styles["Normal"], fontSize=7.5,
                           textColor=GREY, leading=9)
KPI_NUM = ParagraphStyle("KpiNum", parent=styles["Normal"], fontSize=22,
                         textColor=BLUE, leading=24, alignment=TA_CENTER)
KPI_LBL = ParagraphStyle("KpiLbl", parent=styles["Normal"], fontSize=8,
                         textColor=GREY, leading=10, alignment=TA_CENTER)

P = "<font color='#059669'><b>PASS (1.0)</b></font>"
W = "<font color='#d97706'><b>WARN (0.5)</b></font>"
W7 = "<font color='#d97706'><b>WARN (0.7)</b></font>"
F = "<font color='#dc2626'><b>FAIL (0.0)</b></font>"


# ======================================================================
#  Custom flowables
# ======================================================================
class Cover(Flowable):
    """Full hero cover page."""
    def wrap(self, aw, ah):
        self._w, self._h = aw, ah
        return aw, ah

    def draw(self):
        c, w, h = self.canv, self._w, self._h
        # hero band
        band_h = 95 * mm
        c.setFillColor(NAVY)
        c.rect(-20 * mm, h - band_h, w + 40 * mm, band_h, fill=1, stroke=0)
        # accent stripe
        c.setFillColor(BLUE)
        c.rect(-20 * mm, h - band_h, w + 40 * mm, 5, fill=1, stroke=0)
        # decorative dots / blocks
        c.setFillColor(colors.HexColor("#1e3a8a"))
        for i, x in enumerate([130, 144, 158]):
            c.roundRect(x * mm, h - 26 * mm, 9 * mm, 9 * mm, 2, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.roundRect(144 * mm, h - 40 * mm, 9 * mm, 9 * mm, 2, fill=1, stroke=0)
        c.setFillColor(TEAL)
        c.roundRect(158 * mm, h - 40 * mm, 9 * mm, 9 * mm, 2, fill=1, stroke=0)
        # kicker
        c.setFillColor(colors.HexColor("#60a5fa"))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0, h - 34 * mm, "AUDITIFY  ·  TECHNICAL REFERENCE")
        # title
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 33)
        c.drawString(0, h - 50 * mm, "SEO Parameter")
        c.drawString(0, h - 62 * mm, "Implementation")
        # subtitle
        c.setFillColor(colors.HexColor("#cbd5e1"))
        c.setFont("Helvetica", 13)
        c.drawString(0, h - 74 * mm, "How every On-Page SEO parameter is calculated, weighted & scored")
        # meta card
        cy = h - band_h - 18 * mm
        c.setFillColor(LIGHTBLUE)
        c.setStrokeColor(BORDER)
        c.roundRect(0, cy - 36 * mm, w, 36 * mm, 4, fill=1, stroke=1)
        c.setFillColor(GREY)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(SLATE)
        rows = [
            ("SOURCE FILE", "Backend/metricServices/seoMetrics.js  (~3,838 lines)"),
            ("ENTRY POINT", "seoMetrics(url, $, page)   ·   line 3689"),
            ("CALLED FROM", "workers/singleAuditWorker.js"),
            ("WEIGHTED PARAMETERS", "23 scored   +   4 display-only   +   1 dead weight"),
        ]
        ty = cy - 7 * mm
        for k, v in rows:
            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(GREY)
            c.drawString(6 * mm, ty, k)
            c.setFont("Courier", 8.5)
            c.setFillColor(NAVY)
            c.drawString(52 * mm, ty, v)
            ty -= 7.6 * mm
        # date footer on cover
        c.setFillColor(GREY)
        c.setFont("Helvetica", 9)
        c.drawString(0, 14 * mm, f"Generated {DATE}")
        c.drawRightString(w, 14 * mm, "Auditify Engineering")
        c.setStrokeColor(BORDERLT)
        c.line(0, 19 * mm, w, 19 * mm)


class Banner(Flowable):
    """Colored section header band with a number badge."""
    def __init__(self, number, title, color=BLUE, height=11 * mm):
        super().__init__()
        self.number, self.title, self.color, self.height = number, title, color, height

    def wrap(self, aw, ah):
        self._w = aw
        return aw, self.height + 4

    def draw(self):
        c, w, h = self.canv, self._w, self.height
        c.setFillColor(self.color)
        c.roundRect(0, 0, w, h, 3, fill=1, stroke=0)
        # darker number tab
        c.setFillColor(colors.white)
        c.circle(h / 2 + 1, h / 2, 3.6 * mm, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(h / 2 + 1, h / 2 - 1.4 * mm, str(self.number))
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(h + 3 * mm, h / 2 - 1.7 * mm, self.title)


class WeightBars(Flowable):
    """Horizontal bar chart of each parameter's effective share."""
    def __init__(self, data, row_h=6.6 * mm):
        super().__init__()
        self.data, self.row_h = data, row_h

    def wrap(self, aw, ah):
        self._w = aw
        return aw, self.row_h * len(self.data) + 2 * mm

    def draw(self):
        c, w = self.canv, self._w
        label_w, val_w = 52 * mm, 16 * mm
        bar_area = w - label_w - val_w
        maxv = max(d[1] for d in self.data)
        y = self.row_h * (len(self.data) - 1) + 1 * mm
        for label, share, col in self.data:
            cy = y + self.row_h / 2 - 1.4 * mm
            # label
            c.setFillColor(SLATE)
            c.setFont("Courier", 7.3)
            c.drawString(0, cy, label)
            # track
            bx = label_w
            c.setFillColor(LIGHT)
            c.roundRect(bx, y + 1.1 * mm, bar_area, self.row_h - 2.6 * mm, 1.5, fill=1, stroke=0)
            # bar
            bw = max(2, bar_area * (share / maxv))
            c.setFillColor(col)
            c.roundRect(bx, y + 1.1 * mm, bw, self.row_h - 2.6 * mm, 1.5, fill=1, stroke=0)
            # value
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold", 7.6)
            c.drawRightString(w, cy, f"{share:.2f}%")
            y -= self.row_h


def section(num, title, color=BLUE):
    return Banner(num, title, color)


def flow_list(items):
    lis = [ListItem(Paragraph(it, BULLET), leftIndent=8, value="•") for it in items]
    return ListFlowable(lis, bulletType="bullet", start="•",
                        leftIndent=10, bulletFontSize=8, spaceAfter=4)


def chip_row(chips):
    """Row of colored status chips: list of (text, fg, bg)."""
    cells = [Paragraph(f"<font color='{fg}'><b>{t}</b></font>", BULLET) for t, fg, bg in chips]
    t = Table([cells], colWidths=[CONTENT_W / len(chips)] * len(chips))
    style = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
             ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
             ("LEFTPADDING", (0, 0), (-1, -1), 8), ("ROUNDEDCORNERS", [4, 4, 4, 4]),
             ("BOX", (0, 0), (-1, -1), 0, colors.white)]
    for i, (t_, fg, bg) in enumerate(chips):
        style.append(("BACKGROUND", (i, 0), (i, 0), colors.HexColor(bg)))
    tbl = Table([cells], colWidths=[(CONTENT_W - 12) / len(chips)] * len(chips), spaceBefore=2)
    tstyle = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
              ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
              ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]
    for i, (t_, fg, bg) in enumerate(chips):
        tstyle.append(("BACKGROUND", (i, 0), (i, 0), colors.HexColor(bg)))
        tstyle.append(("LINEBEFORE", (i, 0), (i, 0), 2.5, colors.HexColor(fg)))
    tbl.setStyle(TableStyle(tstyle))
    return tbl


story = []

# ======================================================================
#  COVER
# ======================================================================
story.append(Cover())
story.append(PageBreak())

# ======================================================================
#  TABLE OF CONTENTS
# ======================================================================
story.append(section("›", "Contents", INDIGO))
story.append(Spacer(1, 6))
toc = [
    ("1", "Executive summary", "How the audit works at a glance"),
    ("2", "The scoring model", "Fraction → score → status pipeline"),
    ("3", "Weights & share of the SEO score", "All 23 weighted parameters + bar chart"),
    ("4", "Per-parameter implementation flow", "Exact decision branches, 3.1 – 3.23"),
    ("5", "Display-only parameters", "Computed & returned, not scored"),
    ("6", "Basis — what each check inspects", "Elements, fields, resources, keyword lists"),
    ("7", "Final SEO percentage & key notes", "Formula, worked examples, caveats"),
    ("8", "Glossary", "Terms & techniques used in the code"),
]
rows = []
for num, title, desc in toc:
    rows.append([
        Paragraph(f"<b>{num}</b>", ParagraphStyle("n", parent=TOCITEM, textColor=BLUE, alignment=TA_CENTER)),
        Paragraph(f"<b>{title}</b><br/><font size=8 color='#64748b'>{desc}</font>",
                  ParagraphStyle("t", parent=TOCITEM, leading=13)),
    ])
toct = Table(rows, colWidths=[12 * mm, CONTENT_W - 12 * mm])
toct.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDERLT),
    ("BACKGROUND", (0, 0), (0, -1), LIGHTBLUE),
]))
story.append(toct)

story.append(Spacer(1, 10))
# legend
story.append(Paragraph("Status legend", H_PARAM))
story.append(Paragraph("Every check resolves a raw fraction into one of three statuses:", BODY))
story.append(chip_row([
    ("✓  PASS   fraction = 1.0", "#059669", "#ecfdf5"),
    ("!  WARNING   fraction ≥ 0.5", "#d97706", "#fffbeb"),
    ("✕  FAIL   fraction < 0.5", "#dc2626", "#fef2f2"),
]))

story.append(PageBreak())

# ======================================================================
#  SECTION 1 — EXECUTIVE SUMMARY
# ======================================================================
story.append(section("1", "Executive summary", INDIGO))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Auditify&rsquo;s On-Page SEO score is produced by a single module, "
    "<font face='Courier'>seoMetrics.js</font>, which runs <b>27 independent checks</b> against a page. "
    "Each check inspects the live HTML, a headless-browser render, or fetched resources "
    "(robots.txt, sitemap, trust pages) and returns a normalized <b>0&ndash;1 fraction</b>. "
    "23 of those checks are weighted into the final percentage; 4 are computed for display only; "
    "1 weight is declared but never used.", BODY))

# KPI cards
kpis = [
    ("27", "Total checks"),
    ("23", "Weighted"),
    ("1.06", "Total weight"),
    ("3", "Data sources"),
    ("5", "Pages sampled"),
]
kcells = [[Paragraph(n, KPI_NUM)] for n, _ in kpis]
klbls = [[Paragraph(l, KPI_LBL)] for _, l in kpis]
ktbl = Table([[Paragraph(n, KPI_NUM) for n, _ in kpis],
              [Paragraph(l, KPI_LBL) for _, l in kpis]],
             colWidths=[CONTENT_W / 5] * 5)
ktbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHTBLUE),
    ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.white),
    ("TOPPADDING", (0, 0), (-1, 0), 10), ("BOTTOMPADDING", (0, 0), (-1, 0), 0),
    ("TOPPADDING", (0, 1), (-1, 1), 0), ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
]))
story.append(Spacer(1, 4))
story.append(ktbl)

story.append(Spacer(1, 8))
story.append(Paragraph("Parameters by category", H_PARAM))
story.append(Paragraph("The 23 weighted checks group into seven functional families:", BODY))
cat_data = [
    ["Category", "Parameters", "Combined weight"],
    ["Core on-page tags", "Title, Meta Description, H1, Canonical", "0.27"],
    ["Content & relevance", "Content_Relevance, Heading_Hierarchy, Semantic_Tags", "0.14"],
    ["Media", "Image, Video", "0.09"],
    ["Links", "Links, Contextual_Linking, URL_Slugs", "0.14"],
    ["Crawl & technical", "Robots_Txt, Sitemap, Structured_Data", "0.15"],
    ["Social", "Open_Graph, Twitter_Card, Social_Links", "0.05"],
    ["Multi-page & trust", "Title/Meta Uniqueness, Keyword & Location Opt., EEAT", "0.22"],
]
ct = Table(cat_data, colWidths=[36 * mm, 104 * mm, 30 * mm], repeatRows=1)
ct.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.3),
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0, 1), (0, -1), NAVY),
    ("FONTNAME", (2, 1), (2, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (2, 1), (2, -1), BLUE),
    ("ALIGN", (2, 0), (2, -1), "CENTER"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(ct)

story.append(PageBreak())

# ======================================================================
#  SECTION 2 — SCORING MODEL
# ======================================================================
story.append(section("2", "The scoring model", BLUE))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Every check produces a <b>fraction between 0 and 1</b> (common values: 0, 0.5, 0.7, 1). "
    "A shared helper <font face='Courier'>evaluateParameter(score, details, meta)</font> "
    "(<font face='Courier'>seoMetrics.js</font> line 4) converts it into the stored result:", BODY))

# pipeline visual
pipe = Table([[
    Paragraph("<b>RAW FRACTION</b><br/><font size=8 color='#64748b'>0 &ndash; 1</font>",
              ParagraphStyle("p", parent=BODY, alignment=TA_CENTER, leading=13)),
    Paragraph("&rarr;", ParagraphStyle("a", parent=BODY, alignment=TA_CENTER, fontSize=16, textColor=GREY)),
    Paragraph("<b>SCORE</b><br/><font size=8 color='#64748b'>round(f &times; 100)</font>",
              ParagraphStyle("p", parent=BODY, alignment=TA_CENTER, leading=13)),
    Paragraph("&rarr;", ParagraphStyle("a", parent=BODY, alignment=TA_CENTER, fontSize=16, textColor=GREY)),
    Paragraph("<b>STATUS</b><br/><font size=8 color='#64748b'>pass / warning / fail</font>",
              ParagraphStyle("p", parent=BODY, alignment=TA_CENTER, leading=13)),
    Paragraph("&rarr;", ParagraphStyle("a", parent=BODY, alignment=TA_CENTER, fontSize=16, textColor=GREY)),
    Paragraph("<b>ANALYSIS</b><br/><font size=8 color='#64748b'>cause + fix<br/>(if not pass)</font>",
              ParagraphStyle("p", parent=BODY, alignment=TA_CENTER, leading=11)),
]], colWidths=[34 * mm, 8 * mm, 34 * mm, 8 * mm, 38 * mm, 8 * mm, 40 * mm])
pipe.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, 0), LIGHTBLUE), ("BACKGROUND", (2, 0), (2, 0), LIGHTBLUE),
    ("BACKGROUND", (4, 0), (4, 0), LIGHTBLUE), ("BACKGROUND", (6, 0), (6, 0), LIGHTBLUE),
    ("BOX", (0, 0), (0, 0), 0.6, BLUE), ("BOX", (2, 0), (2, 0), 0.6, BLUE),
    ("BOX", (4, 0), (4, 0), 0.6, BLUE), ("BOX", (6, 0), (6, 0), 0.6, BLUE),
    ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(Spacer(1, 4))
story.append(pipe)
story.append(Spacer(1, 6))

story.append(Paragraph(
    "score = round(fraction &times; 100) &nbsp;&bull;&nbsp; "
    "status = (fraction == 1 &rarr; <font color='#059669'><b>pass</b></font>) , "
    "(fraction &ge; 0.5 &rarr; <font color='#d97706'><b>warning</b></font>) , "
    "(fraction &lt; 0.5 &rarr; <font color='#dc2626'><b>fail</b></font>)", CODE))
story.append(Paragraph(
    "<b>Important:</b> status is derived from the <i>raw</i> fraction <i>before</i> rounding, and "
    "<font face='Courier'>analysis</font> (a cause + recommendation pair) is only attached when the "
    "parameter is not passing. <font face='Courier'>Content_Relevance</font> is the one metric that "
    "bypasses this helper (see Section 7).", BODY))

story.append(Spacer(1, 4))
story.append(Paragraph("Three data sources, no external API", H_PARAM))
src_data = [
    ["Source", "How it is read", "Used by"],
    ["Cheerio DOM", "Server-parsed static HTML via the $ selector", "Tags, headings, links, images, social"],
    ["Puppeteer", "Headless-browser render, page.evaluate()", "Structured_Data, robots/sitemap fetch"],
    ["HTTP fetch", "Direct HEAD / GET (node-fetch)", "Images, sitemap, multi-page samples, EEAT"],
]
st = Table(src_data, colWidths=[30 * mm, 70 * mm, 70 * mm], repeatRows=1)
st.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.3),
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0, 1), (0, -1), BLUE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(st)
story.append(Paragraph(
    "No external PageSpeed / Lighthouse API is used here &mdash; Core Web Vitals live in a separate "
    "module, <font face='Courier'>technicalMetrics.js</font>.", META))

story.append(PageBreak())

# ======================================================================
#  SECTION 3 — WEIGHTS
# ======================================================================
story.append(section("3", "Weights & share of the SEO score", BLUE))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "23 parameters are weighted into the SEO percentage. Their weights sum to <b>1.06</b> "
    "(<font face='Courier'>totalWeight</font>); the score is divided by that sum, so the "
    "&ldquo;Share&rdquo; column is each parameter&rsquo;s true contribution.", BODY))

weights_data = [
    ["Parameter (key)", "Weight", "Share", "Source", "Fn line"],
    ["H1", "0.10", "9.43%", "Cheerio", "1086"],
    ["Content_Relevance", "0.10", "9.43%", "Cheerio", "895"],
    ["Image", "0.08", "7.55%", "Cheerio + HTTP HEAD", "92"],
    ["Canonical", "0.08", "7.55%", "Cheerio", "1170"],
    ["Contextual_Linking", "0.08", "7.55%", "Cheerio + HTTP GET", "698"],
    ["EEAT", "0.08", "7.55%", "Page fetch + regex", "2936"],
    ["Structured_Data", "0.06", "5.66%", "Puppeteer", "1603"],
    ["Meta_Description", "0.05", "4.72%", "Cheerio", "1127"],
    ["Sitemap", "0.05", "4.72%", "HTTP fetch", "1431"],
    ["Title", "0.04", "3.77%", "Cheerio", "1044"],
    ["Title_Uniqueness", "0.04", "3.77%", "Multi-page HTTP", "2159"],
    ["Title_Keyword_Optimization", "0.04", "3.77%", "Multi-page HTTP", "2172"],
    ["Robots_Txt", "0.04", "3.77%", "HTTP fetch", "1308"],
    ["Title_Location_Optimization", "0.03", "2.83%", "Schema/footer/contact", "2239"],
    ["Meta_Description_Uniqueness", "0.03", "2.83%", "Multi-page HTTP", "2162"],
    ["Heading_Hierarchy", "0.03", "2.83%", "Cheerio", "309"],
    ["URL_Slugs", "0.03", "2.83%", "URL parsing", "57"],
    ["Links", "0.03", "2.83%", "Cheerio", "350"],
    ["Open_Graph", "0.02", "1.89%", "Cheerio", "1254"],
    ["Twitter_Card", "0.02", "1.89%", "Cheerio", "1254"],
    ["Semantic_Tags", "0.01", "0.94%", "Cheerio", "485"],
    ["Video", "0.01", "0.94%", "Cheerio", "264"],
    ["Social_Links", "0.01", "0.94%", "Cheerio", "1254"],
    ["TOTAL (weighted)", "1.06", "100%", "", ""],
]
wt = Table(weights_data, colWidths=[54 * mm, 16 * mm, 16 * mm, 50 * mm, 18 * mm], repeatRows=1)
wt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("FONTNAME", (0, 1), (0, -1), "Courier"),
    ("FONTSIZE", (0, 1), (0, -1), 7.5),
    ("FONTNAME", (4, 1), (4, -1), "Courier"),
    ("ALIGN", (1, 0), (2, -1), "CENTER"), ("ALIGN", (4, 0), (4, -1), "CENTER"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, LIGHT]),
    ("BACKGROUND", (0, -1), (-1, -1), LIGHTBLUE),
    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0, -1), (-1, -1), BLUE),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 2.4), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.4),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
]))
story.append(wt)
story.append(Paragraph(
    "* Content_Relevance is weighted using its raw <font face='Courier'>.percentage</font>, "
    "not the standard <font face='Courier'>.score</font> (see Section 7). &nbsp;"
    "&ldquo;Fn line&rdquo; = line of the check function in <font face='Courier'>seoMetrics.js</font>.", META))

story.append(Spacer(1, 8))
story.append(Paragraph("Effective share of the SEO score (visual)", H_PARAM))
bar_data = [
    ("H1", 9.43, BLUE), ("Content_Relevance", 9.43, BLUE),
    ("Image", 7.55, BLUEDK), ("Canonical", 7.55, BLUEDK),
    ("Contextual_Linking", 7.55, BLUEDK), ("EEAT", 7.55, BLUEDK),
    ("Structured_Data", 5.66, INDIGO), ("Meta_Description", 4.72, INDIGO),
    ("Sitemap", 4.72, INDIGO), ("Title", 3.77, TEAL),
    ("Title_Uniqueness", 3.77, TEAL), ("Title_Keyword_Opt.", 3.77, TEAL),
    ("Robots_Txt", 3.77, TEAL), ("Title_Location_Opt.", 2.83, GREEN),
    ("Meta_Desc_Uniqueness", 2.83, GREEN), ("Heading_Hierarchy", 2.83, GREEN),
    ("URL_Slugs", 2.83, GREEN), ("Links", 2.83, GREEN),
    ("Open_Graph", 1.89, GREYLT), ("Twitter_Card", 1.89, GREYLT),
    ("Semantic_Tags", 0.94, GREYLT), ("Video", 0.94, GREYLT),
    ("Social_Links", 0.94, GREYLT),
]
story.append(WeightBars(bar_data))

story.append(Spacer(1, 6))
# callout box for display-only / dead weight
callout = Table([[Paragraph(
    "<b>Not in the percentage.</b> &nbsp;<b>Display-only</b> (computed &amp; returned): "
    "<font face='Courier'>URL_Structure</font>, <font face='Courier'>Service_Content_Quality</font>, "
    "<font face='Courier'>Content_Depth_Quality</font>, <font face='Courier'>Local_SEO</font>. &nbsp;&nbsp;"
    "<b>Dead weight:</b> <font face='Courier'>Duplicate_Content (0.02)</font> sits in the weights object "
    "but is never computed, never in the formula, and never returned.", BODY)]],
    colWidths=[CONTENT_W])
callout.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), AMBERBG),
    ("LINEBEFORE", (0, 0), (0, -1), 3, AMBER),
    ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#fcd34d")),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(callout)

story.append(PageBreak())

# ======================================================================
#  SECTION 4 — PER-PARAMETER FLOW
# ======================================================================
story.append(section("4", "Per-parameter implementation flow", BLUE))
story.append(Spacer(1, 5))
story.append(Paragraph(
    "Each parameter below shows the exact decision flow the code follows, in order, "
    "with the score it assigns at each branch.", BODY))


def add_param(num, title, meta_line, intro, branches, code=None):
    block = [Paragraph(f"{num}&nbsp;&nbsp;{title}", H_PARAM),
             Paragraph(meta_line, META)]
    if intro:
        block.append(Paragraph(intro, BODY))
    if branches:
        block.append(flow_list(branches))
    if code:
        block.append(Paragraph(code, CODE))
    # wrap in a left-accent card
    inner = Table([[b] for b in block], colWidths=[CONTENT_W - 8 * mm])
    inner.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LINEBEFORE", (0, 0), (0, -1), 2.5, BLUE),
    ]))
    story.append(Spacer(1, 3))
    story.append(KeepTogether(inner))


add_param("3.1", "Title &mdash; <font face='Courier'>Title</font>", "Weight 0.04 &bull; Cheerio <font face='Courier'>$(\"title\")</font> &bull; checkTitle() &bull; line 1044",
    "Does a &lt;title&gt; tag exist? If yes, measure its text length and branch:",
    [
        f"&lt;title&gt; tag missing &rarr; {F}",
        f"Tag exists but text length == 0 (empty) &rarr; {F}",
        f"Length &lt; 30 characters (too short) &rarr; {W}",
        f"Length &gt; 60 characters (too long, may truncate in SERP) &rarr; {W}",
        f"Length 30&ndash;60 characters (optimal) &rarr; {P}",
    ])

add_param("3.2", "Meta Description &mdash; <font face='Courier'>Meta_Description</font>", "Weight 0.05 &bull; Cheerio <font face='Courier'>meta[name=description]</font> &bull; checkMetaDescription() &bull; line 1127",
    "Does the meta description tag exist? If yes, measure the <font face='Courier'>content</font> length:",
    [
        f"Tag missing &rarr; {F}",
        f"Tag exists but content length == 0 &rarr; {F}",
        f"Length &lt; 50 characters (too short) &rarr; {W}",
        f"Length &gt; 160 characters (too long) &rarr; {W}",
        f"Length 50&ndash;160 characters (optimal) &rarr; {P}",
    ])

add_param("3.3", "H1 &mdash; <font face='Courier'>H1</font>", "Weight 0.10 &bull; Cheerio <font face='Courier'>$(\"h1\")</font> &bull; checkH1() &bull; line 1086",
    "Count the &lt;h1&gt; tags on the page:",
    [
        f"0 H1 tags (missing) &rarr; {W} &nbsp;<i>(note: a warning, not a hard fail)</i>",
        f"Exactly 1 H1 but its text is empty &rarr; {W}",
        f"Exactly 1 H1 with text &rarr; {P}",
        f"More than 1 H1 tag &rarr; {W}",
    ])

add_param("3.4", "Canonical &mdash; <font face='Courier'>Canonical</font>", "Weight 0.08 &bull; Cheerio <font face='Courier'>link[rel=canonical]</font> &bull; checkCanonical() &bull; line 1170",
    "Does a canonical link exist? Then validate it:",
    [
        f"No canonical tag &rarr; {W}",
        f"More than one canonical tag &rarr; {F}",
        f"Canonical href is empty &rarr; {F}",
        f"Canonical URL is malformed/unparseable &rarr; {F}",
        f"Self-referencing (points to this page) &rarr; {P}",
        f"Points to another URL on the <b>same domain</b> &rarr; {P}",
        f"Points to an <b>external domain</b> &rarr; {F}",
    ])

add_param("3.5", "Image &mdash; <font face='Courier'>Image</font>", "Weight 0.08 &bull; Cheerio <font face='Courier'>$(\"img\")</font> + HTTP HEAD (up to 15 unique srcs) &bull; checkImages() &bull; line 92",
    "If there are no images &rarr; score 1.0. Otherwise a weighted composite is built from four sub-scores:",
    [
        "<b>altScore</b> = images with alt text / total &nbsp;(weight 0.5)",
        "<b>meaningfulScore</b> = images with non-generic alt (&ge;2 words or &gt;5 chars, not in a blocklist like &lsquo;logo/icon/image&rsquo;) / total &nbsp;(weight 0.2)",
        "<b>titleScore</b> = images with a title attribute / total &nbsp;(weight 0.1)",
        "<b>sizeScore</b> = 1 &minus; 0.1 per image &gt;150KB (HTTP HEAD content-length) &nbsp;(weight 0.2)",
    ],
    "weightedScore = altScore&times;0.5 + meaningfulScore&times;0.2 + titleScore&times;0.1 + sizeScore&times;0.2<br/>"
    "if (score &lt; 0.5) score = 0.5 (floor) &nbsp;&bull;&nbsp; if any broken image (bad HTTP/Content-Type) &rarr; score forced to 0.5")

add_param("3.6", "Video &mdash; <font face='Courier'>Video</font>", "Weight 0.01 &bull; Cheerio <font face='Courier'>video, iframe[youtube|vimeo]</font> &bull; checkVideos() &bull; line 264",
    "If there are no videos &rarr; score 1.0. Otherwise average three sub-scores:",
    [
        "<b>embedScore</b> = 1 (always, embedding is present)",
        "<b>lazyScore</b> = videos with loading=&lsquo;lazy&rsquo; (or .lazy class) / total",
        "<b>metaScore</b> = videos with itemprop metadata / total",
    ],
    "score = (embedScore + lazyScore + metaScore) / 3")

add_param("3.7", "Heading Hierarchy &mdash; <font face='Courier'>Heading_Hierarchy</font>", "Weight 0.03 &bull; Cheerio <font face='Courier'>h1..h6</font> &bull; checkHeadingHierarchy() &bull; line 309",
    "Start at score 1, then apply penalties based on heading structure:",
    [
        f"No headings at all on the page &rarr; {F}",
        f"Multiple H1 tags &rarr; {W}",
        f"Any skipped level (e.g. H2 &rarr; H4) or missing H1 &rarr; {W}",
        f"Single H1 and no skipped levels &rarr; {P}",
    ])

add_param("3.8", "Semantic Tags &mdash; <font face='Courier'>Semantic_Tags</font>", "Weight 0.01 &bull; Cheerio <font face='Courier'>main, nav, header, footer, &hellip;</font> &bull; checkSemanticTags() &bull; line 485",
    "Checks for HTML5 landmark tags, in order:",
    [
        f"&lt;main&gt; missing OR more than one &lt;main&gt; &rarr; {W}",
        f"Missing any of &lt;header&gt; / &lt;nav&gt; / &lt;footer&gt; &rarr; {W}",
        f"Only &lt;main&gt; present and NO div-class heuristic replacements found &rarr; {F} (severe, div-only layout)",
        f"Only &lt;main&gt; present but div replacements detected &rarr; {W}",
        f"All major semantic tags properly used &rarr; {P}",
    ])

add_param("3.9", "Links &mdash; <font face='Courier'>Links</font>", "Weight 0.03 &bull; Cheerio <font face='Courier'>$(\"a\")</font> (no network) &bull; checkLinks() &bull; line 350",
    "Counts internal/external/unique links and inspects anchor text. <font face='Courier'>descRatio = descriptive anchors / total</font>.",
    [
        f"Any generic anchors (&lsquo;click here&rsquo;, &lsquo;read more&rsquo;, &lsquo;here&rsquo;&hellip;) OR descRatio &lt; 0.75 &rarr; {W}",
        f"Otherwise (descriptive anchors, no generic text) &rarr; {P}",
    ])

add_param("3.10", "URL Slugs &mdash; <font face='Courier'>URL_Slugs</font>", "Weight 0.03 &bull; URL parsing only &bull; checkSlugs() &bull; line 57",
    "Examines the last path segment of the URL:",
    [
        f"Root URL (&lsquo;/&rsquo; or empty path) &rarr; {P}",
        "Penalty triggers (any one &rarr; warning): last segment &gt;50 chars; contains uppercase; contains underscores; contains numbers when path depth &gt; 2",
        f"Any penalty triggered &rarr; {W}",
        f"Clean slug (no penalties) &rarr; {P}",
    ])

add_param("3.11", "Contextual Linking &mdash; <font face='Courier'>Contextual_Linking</font>", "Weight 0.08 &bull; Cheerio + HTTP GET (up to 150 links) &bull; checkContextualLinks() &bull; line 698",
    "Extracts in-content links (vs nav/menu links), computes ratio = contextual / (contextual + menu). Start at score 1, drop to 0.5 if any condition hits:",
    [
        f"Zero contextual links in main content &rarr; {W}",
        f"More than 100 contextual links (spam risk) &rarr; {W}",
        f"Ratio &lt; 0.3 (most links are navigation) &rarr; {W}",
        f"More than 5 important menu pages not linked contextually &rarr; {W}",
        f"Any broken contextual link (HTTP GET fails; links containing &lsquo;inventory&rsquo; are skipped) &rarr; {W}",
        f"None of the above &rarr; {P}",
    ])

add_param("3.12", "Content Relevance &mdash; <font face='Courier'>Content_Relevance</font>", "Weight 0.10 &bull; Cheerio body text vs title+meta keywords &bull; checkContentRelevance() &bull; line 895",
    "Extracts target keywords from the title + meta description, then matches them against page content (exact, stemmed, 2-word phrases, and &ge;5-char brand substrings).",
    [
        "N = number of target keywords; M = matched keywords",
        "<b>P = round(M / N &times; 100)</b> &mdash; this raw percentage is what feeds the weighted SEO score",
        "Keyword-stuffing penalty: any word with frequency &gt;7% of body text subtracts 10 &rarr; finalScore = clamp(P &minus; penalty, 0, 100)",
        "Labels (display): finalScore &ge;75 = HIGH/pass, &ge;40 = MEDIUM/warning, else LOW/fail",
        "If no keywords could be extracted (N=0) &rarr; percentage 0, LOW",
    ],
    "Weighting note: the score formula multiplies <font face='Courier'>contentRelevanceMetric.percentage</font> (raw P), "
    "NOT the penalized finalScore, and not a 0&ndash;1 fraction.")

add_param("3.13", "Robots.txt &mdash; <font face='Courier'>Robots_Txt</font>", "Weight 0.04 &bull; HTTP fetch <font face='Courier'>/robots.txt</font> (Puppeteer-first, node-fetch fallback) &bull; checkRobotsTxt() &bull; line 1308",
    "Fetch /robots.txt, then evaluate the <font face='Courier'>User-agent: *</font> block:",
    [
        f"File missing (HTTP &ge; 400 and no content) &rarr; {W}",
        f"File present but empty &rarr; {W}",
        f"Full-site block &mdash; <font face='Courier'>Disallow: /</font> &rarr; {F}",
        f"Query params blocked &mdash; <font face='Courier'>Disallow: /*?</font> &rarr; {W7}",
        f"Otherwise (valid, not fully blocked) &rarr; {P}",
    ])

add_param("3.14", "Sitemap &mdash; <font face='Courier'>Sitemap</font>", "Weight 0.05 &bull; HTTP fetch (robots-declared + /sitemap.xml + /sitemap_index.xml) &bull; checkSitemap() &bull; line 1431",
    "Try each candidate sitemap URL until one loads, then validate:",
    [
        f"No sitemap found anywhere &rarr; {W}",
        f"Found but invalid structure (no &lt;urlset&gt; / &lt;sitemapindex&gt;) &rarr; {F}",
        f"Valid but no &lt;lastmod&gt; at all, OR any lastmod older than 180 days &rarr; {W} (outdated)",
        f"Valid and fresh &rarr; {P}",
    ])

add_param("3.15", "Structured Data &mdash; <font face='Courier'>Structured_Data</font>", "Weight 0.06 &bull; Puppeteer <font face='Courier'>script[type=application/ld+json]</font> &bull; checkStructuredData() &bull; line 1603",
    "Parses all JSON-LD blocks (presence check only &mdash; it does NOT validate schema correctness):",
    [
        f"At least one valid JSON-LD block present &rarr; {P}",
        f"No JSON-LD found &rarr; {W}",
        f"Parse/page error &rarr; {F}",
    ])

add_param("3.16", "Open Graph &mdash; <font face='Courier'>Open_Graph</font>", "Weight 0.02 &bull; Cheerio <font face='Courier'>meta[property=og:*]</font> &bull; checkSocial() &bull; line 1254",
    "Checks required Open Graph tags: <font face='Courier'>og:title, og:image, og:url</font>.",
    [
        f"All three required OG tags present &rarr; {P}",
        f"Any required OG tag missing &rarr; {W}",
    ])

add_param("3.17", "Twitter Card &mdash; <font face='Courier'>Twitter_Card</font>", "Weight 0.02 &bull; Cheerio twitter meta tags &bull; checkSocial() &bull; line 1254",
    "Checks required Twitter Card tags: <font face='Courier'>twitter:card, twitter:title</font>.",
    [
        f"Both required Twitter tags present &rarr; {P}",
        f"Either missing &rarr; {W}",
    ])

add_param("3.18", "Social Links &mdash; <font face='Courier'>Social_Links</font>", "Weight 0.01 &bull; Cheerio <font face='Courier'>$(\"a\")</font> vs social-domain list &bull; checkSocial() &bull; line 1254",
    "Scans all anchors for links to known social domains (facebook, x/twitter, linkedin, instagram, youtube, &hellip;).",
    [
        f"At least one social profile link found &rarr; {P}",
        f"No social links found &rarr; {W}",
    ])

add_param("3.19", "Title Uniqueness &mdash; <font face='Courier'>Title_Uniqueness</font>", "Weight 0.04 &bull; Multi-page HTTP (up to 5 internal pages) &bull; checkTitleUniqueness() &rarr; tuScoreUniqueness() &bull; line 2159",
    "Samples up to 5 eligible internal pages (sitemap first, else homepage crawl) and fetches each page&rsquo;s &lt;title&gt; once.",
    [
        f"Sample failed / no eligible pages (<font face='Courier'>!sample.ok</font>) &rarr; {W} (inconclusive)",
        f"All sampled titles missing (foundCount == 0) &rarr; {F}",
        "Otherwise: <b>score = uniqueCount / pagesChecked</b> (distinct case-insensitive titles &divide; total pages sampled; missing values dilute the score)",
    ])

add_param("3.20", "Meta Description Uniqueness &mdash; <font face='Courier'>Meta_Description_Uniqueness</font>", "Weight 0.03 &bull; Multi-page HTTP (same 5-page sample) &bull; checkMetaDescriptionUniqueness() &rarr; tuScoreUniqueness() &bull; line 2162",
    "Identical logic to Title Uniqueness, applied to the meta description field:",
    [
        f"Sample failed &rarr; {W} (inconclusive)",
        f"All descriptions missing &rarr; {F}",
        "Otherwise: <b>score = uniqueCount / pagesChecked</b>",
    ])

add_param("3.21", "Title Keyword Optimization &mdash; <font face='Courier'>Title_Keyword_Optimization</font>", "Weight 0.04 &bull; Multi-page HTTP &bull; checkTitleKeywordOptimization() &bull; line 2172",
    "For each sampled page, derives a target keyword and checks whether the page&rsquo;s &lt;title&gt; contains it. Keyword derivation cascade: (1) URL slug &rarr; (2) H1 first 3 tokens &rarr; (3) top-2 most frequent content words.",
    [
        f"Sample failed (<font face='Courier'>!sample.ok</font>) &rarr; {W} (inconclusive)",
        "Otherwise: <b>score = optimizedCount / pagesChecked</b> (titles containing their derived keyword &divide; pages). Match = keyword token, or its &ge;4-char stem, is a substring of the title.",
    ])

add_param("3.22", "Title Location Optimization &mdash; <font face='Courier'>Title_Location_Optimization</font>", "Weight 0.03 &bull; Schema &rarr; footer &rarr; contact page &rarr; body &bull; checkTitleLocationOptimization() &bull; line 2239",
    "Resolves the business city/state using a cascade (first hit wins): (1) JSON-LD schema address, (2) footer text, (3) fetched contact page, (4) whole-page body text. Then checks whether the title mentions that location.",
    [
        f"Location cannot be determined (no city and no state) &rarr; {W} (inconclusive)",
        f"Title mentions the resolved city / state / state-abbreviation &rarr; {P}",
        f"Location resolved but title does NOT mention it &rarr; {F}",
    ])

add_param("3.23", "E-E-A-T &mdash; <font face='Courier'>EEAT</font>", "Weight 0.08 &bull; Trust-page discovery + fetch (cap 5) + regex &bull; checkEEAT() &bull; line 2936",
    "Discovers and fetches trust pages (About/Contact/Team/Privacy/Terms), then scores five sub-checks 0&ndash;2 each. Final fraction = score10 / 10.",
    [
        "<b>About (0&ndash;2):</b> &gt;1 story/mission/history term AND &ge;150 words &rarr; 2; some signals &rarr; 1; no about page &rarr; 0",
        "<b>Contact (0&ndash;2):</b> count of {phone, email, address, contact form}: &ge;3 &rarr; 2; &ge;1 &rarr; 1; else 0",
        "<b>Author/Team (0&ndash;2):</b> team page/keywords AND credentials &rarr; 2; team only &rarr; 1; else 0",
        "<b>Experience (0&ndash;2):</b> of {years/established, experience, awards, testimonials, case studies, certifications}: &ge;2 &rarr; 2; &ge;1 &rarr; 1; else 0",
        "<b>Trust (0&ndash;2):</b> count of {HTTPS, privacy policy, terms, review/trust badge}: &ge;3 &rarr; 2; &ge;1 &rarr; 1; else 0",
    ],
    "score10 = about + contact + author + experience + trust &nbsp;(0&ndash;10) &nbsp;&bull;&nbsp; fraction = score10 / 10")

story.append(PageBreak())

# ======================================================================
#  SECTION 5 — DISPLAY-ONLY
# ======================================================================
story.append(section("5", "Display-only parameters (returned, not scored)", TEAL))
story.append(Spacer(1, 5))
story.append(Paragraph(
    "These are fully computed and returned in the response, but are NOT part of the weighted SEO percentage.", BODY))

add_param("4.1", "URL Structure &mdash; <font face='Courier'>URL_Structure</font>", "Display-only &bull; URL parsing &bull; checkURLStructure() &bull; line 999",
    "Penalizes: uppercase in path, underscores, query parameters, depth &gt; 3 segments.",
    [
        f"Any issue &rarr; {W} &nbsp; / &nbsp; No issues &rarr; {P}",
        "Has no entry in the weights object &rarr; never affects the score (only <font face='Courier'>URL_Slugs</font> is weighted).",
    ])

add_param("4.2", "Service Content Quality &mdash; <font face='Courier'>Service_Content_Quality</font>", "Display-only (0&ndash;10) &bull; Service-page fetch &bull; checkServiceContentQuality() &bull; line 2370",
    "Finds the best service page, scores four sub-checks 0&ndash;2 each (raw 0&ndash;8). Returns 0 if no service page / page fails to load.",
    [
        "<b>Description (0&ndash;2):</b> of {H1 + &ge;40 words, benefits keywords or &ge;3 list items, target-audience text}: &ge;2 &rarr; 2; 1 &rarr; 1; else 0",
        "<b>Content length (0&ndash;2):</b> &ge;150 words &rarr; 2; &ge;75 &rarr; 1; else 0",
        "<b>Booking (0&ndash;2):</b> booking embed/form/CTA &rarr; 2; any form &rarr; 1; else 0",
        "<b>Pre-service info (0&ndash;2):</b> of {process, timeline, pricing, requirements, faq}: &ge;2 &rarr; 2; 1 &rarr; 1; else 0",
    ],
    "rawScore = sum of 4 (0&ndash;8) &nbsp;&bull;&nbsp; fraction = rawScore / 8")

add_param("4.3", "Content Depth Quality &mdash; <font face='Courier'>Content_Depth_Quality</font>", "Display-only (0&ndash;10) &bull; Up to 6 typed pages &bull; checkContentDepthQuality() &bull; line 2651",
    "Classifies and fetches up to 6 typed pages (SRP/VDP/Service/Trade-In/About/Contact). Each page scored on three 0&ndash;2 checks, then per-page scores averaged. No targets &rarr; 0.5 (inconclusive).",
    [
        "<b>Relevance (0&ndash;2):</b> of 5 signals {brand, location, phone/email, year, dealer name}: &ge;3 &rarr; 2; &ge;1 &rarr; 1; else 0 (capped at 1 if type-mandatory mentions are missing)",
        "<b>Depth (0&ndash;2):</b> word count vs per-type threshold (e.g. VDP 200, SRP 150, contact 100): &ge;threshold &rarr; 2; &ge;60% &rarr; 1; else 0",
        "<b>Uniqueness (0&ndash;2):</b> max Jaccard similarity (4-gram fingerprint) vs other pages: &lt;0.30 &rarr; 2; 0.30&ndash;0.60 &rarr; 1; &gt;0.60 &rarr; 0",
    ],
    "per-page raw = relevance + depth + uniqueness (0&ndash;6) &rarr; score10 &nbsp;&bull;&nbsp; final = mean of per-page score10, &divide;10")

add_param("4.4", "Local SEO &mdash; <font face='Courier'>Local_SEO</font>", "Display-only (0&ndash;100, avg of 8 sub-signals) &bull; checkLocalSEO() &bull; line 3643",
    "Aggregates eight local-SEO sub-signals; final score = simple average of the 8 sub-scores. Two sub-signals are marked <font face='Courier'>partial</font> (link-detection only; full data needs the Google Places API).",
    [
        "<b>NAP_Consistency</b> = points / 4 (schema name, phone, address with city/state, consistency)",
        "<b>LocalBusiness_Schema</b> = present / 6 (name, address, telephone, geo, openingHours, sameAs); 0 if no LocalBusiness node",
        "<b>Location_Targeting</b> = hits / 3 (city/state in Title, Meta, Body); 0 if no location",
        "<b>Local_Keyword_Usage</b> = cityHits&ge;2 or &lsquo;near me&rsquo; &rarr; 1; cityHits==1 &rarr; 0.5; else 0",
        "<b>Local_Landing_Pages</b> = dedicated location page &rarr; 1; business location only &rarr; 0.5; else 0",
        "<b>Location_Page_Completeness</b> = present / 4 (map, hours, directions, phone/NAP)",
        "<b>Google_Business_Profile</b> = GBP/Maps link present &rarr; 1; else 0 &nbsp;<i>(partial)</i>",
        "<b>Review_Signals</b> = rating schema or review links &rarr; 1; star widget &rarr; 0.5; else 0 &nbsp;<i>(partial)</i>",
    ],
    "Local_SEO = average(8 sub-signal scores)")

story.append(PageBreak())

# ======================================================================
#  SECTION 6 — BASIS
# ======================================================================
story.append(section("6", "Basis — what each check fetches / inspects", BLUE))
story.append(Spacer(1, 5))
story.append(Paragraph(
    "For transparency, this section lists the precise data each parameter reads &mdash; the HTML elements, "
    "schema fields, HTTP resources, regex patterns and keyword lists it inspects to decide a score.", BODY))


def add_basis(title, items):
    story.append(Paragraph(title, H_PARAM))
    story.append(flow_list(items))


add_basis("Title / Meta Description / H1 / Canonical (on-page tags)", [
    "<b>Title</b>: text of <font face='Courier'>$(\"title\")</font> &mdash; existence + character length.",
    "<b>Meta Description</b>: <font face='Courier'>meta[name=\"description\"]</font> &rarr; <font face='Courier'>content</font> attribute length.",
    "<b>H1</b>: count and text of all <font face='Courier'>$(\"h1\")</font> elements.",
    "<b>Canonical</b>: <font face='Courier'>link[rel=\"canonical\"]</font> &rarr; <font face='Courier'>href</font>; compared host+path+query against the current URL to classify self / internal / external.",
])

add_basis("Image", [
    "All <font face='Courier'>$(\"img\")</font>: reads <font face='Courier'>src</font>, <font face='Courier'>alt</font>, <font face='Courier'>title</font> attributes.",
    "&lsquo;Meaningful&rsquo; alt = not in a blocklist (image, logo, icon, pic, photo, spacer, img, &hellip;) and &ge;2 words or &gt;5 chars.",
    "Up to 15 unique srcs are fetched via <b>HTTP HEAD</b> &mdash; reads <font face='Courier'>content-type</font> (broken if not <font face='Courier'>image/*</font>) and <font face='Courier'>content-length</font> (&gt;150KB = heavy).",
])

add_basis("Video", [
    "<font face='Courier'>video</font> tags and <font face='Courier'>iframe[src*='youtube'|'vimeo']</font>.",
    "Reads <font face='Courier'>loading=\"lazy\"</font> (or <font face='Courier'>.lazy</font> class) and <font face='Courier'>itemprop</font> metadata on each.",
])

add_basis("Heading Hierarchy / Semantic Tags", [
    "<b>Hierarchy</b>: all <font face='Courier'>h1..h6</font> in document order &mdash; checks single H1 and no skipped levels (e.g. H2&rarr;H4).",
    "<b>Semantic</b>: presence/count of <font face='Courier'>main, nav, article, section, header, footer, aside</font>; heuristic fallback looks for <font face='Courier'>div[class*=\"&lt;tag&gt;\"]</font> as a &lsquo;potential replacement&rsquo;.",
])

add_basis("Links / Contextual Linking", [
    "<b>Links</b>: all <font face='Courier'>$(\"a\")</font> &mdash; internal vs external by hostname; generic-anchor blocklist (&lsquo;click here&rsquo;, &lsquo;read more&rsquo;, &lsquo;here&rsquo;, &lsquo;learn more&rsquo;, &hellip;).",
    "<b>Contextual</b>: links inside <font face='Courier'>main, article, .content, #content, .post</font> vs links inside <font face='Courier'>nav, header, footer, .menu, .sidebar</font>; relevance judged by an intent/slug/TLD map (e.g. &lsquo;sign in&rsquo;&rarr;/login).",
    "Broken-link check: up to 150 in-content links fetched via <b>HTTP GET</b> (URLs containing &lsquo;inventory&rsquo; are skipped).",
])

add_basis("Content Relevance", [
    "Visible body text (scripts/styles/hidden elements removed) vs keywords extracted from title + meta description.",
    "Matching is exact word, stemmed word, 2-word phrases, and &ge;5-char brand substrings.",
    "Stuffing penalty uses body-only word frequencies (excludes header/nav/footer); any word &gt;7% frequency = penalty.",
])

add_basis("URL Slugs / URL Structure", [
    "Parsed from <font face='Courier'>new URL(url)</font> &mdash; no network.",
    "<b>Slugs</b>: last path segment &mdash; length, uppercase, underscores, numbers (when depth &gt; 2).",
    "<b>Structure</b>: full path &mdash; uppercase, underscores, query string, segment depth &gt; 3.",
])

add_basis("Robots.txt / Sitemap / Structured Data (fetched resources)", [
    "<b>Robots</b>: <b>HTTP fetch</b> of <font face='Courier'>/robots.txt</font>; parses the <font face='Courier'>User-agent: *</font> block for <font face='Courier'>Disallow: /</font> (full block) and <font face='Courier'>Disallow: /*?</font> (params).",
    "<b>Sitemap</b>: sitemap URLs from robots.txt + <font face='Courier'>/sitemap.xml</font> + <font face='Courier'>/sitemap_index.xml</font>; validates <font face='Courier'>&lt;urlset&gt;/&lt;sitemapindex&gt;</font> and <font face='Courier'>&lt;lastmod&gt;</font> freshness (180-day cutoff).",
    "<b>Structured Data</b>: Puppeteer reads all <font face='Courier'>script[type=\"application/ld+json\"]</font>, JSON-parses them, and lists <font face='Courier'>@type</font> values (presence only).",
])

add_basis("Open Graph / Twitter Card / Social Links", [
    "<b>OG</b>: <font face='Courier'>meta[property=\"og:title\"|\"og:image\"|\"og:url\"]</font> (required set).",
    "<b>Twitter</b>: <font face='Courier'>meta[name|property=\"twitter:card\"|\"twitter:title\"]</font> (required set).",
    "<b>Social Links</b>: anchors whose hostname matches facebook/x/twitter/linkedin/instagram/youtube/pinterest/tiktok/reddit/medium/&hellip;",
])

add_basis("Title Uniqueness / Meta Uniqueness / Keyword / Location (multi-page)", [
    "Samples up to 5 internal pages (sitemap first, else homepage crawl); excludes inventory/VDP/legal pages and asset URLs.",
    "<b>Uniqueness</b>: each page&rsquo;s <font face='Courier'>&lt;title&gt;</font> / meta description, compared case-insensitively for distinct values.",
    "<b>Keyword</b>: target keyword derived from URL slug &rarr; H1 &rarr; top content words, then matched (substring or &ge;4-char stem) against the title.",
    "<b>Location</b>: city/state resolved via cascade &mdash; JSON-LD address &rarr; footer text &rarr; fetched contact page &rarr; body text; then checked against the title.",
])

add_basis("E-E-A-T", [
    "Fetches About/Contact/Team/Privacy/Terms pages (cap 5) and scans text with keyword regex.",
    "<b>About</b>: &lsquo;our story / history / founded / established / since YEAR / mission / vision / values / who we are&rsquo; + word count &ge;150.",
    "<b>Contact</b>: phone regex, email regex, street/address, and a contact <font face='Courier'>&lt;form&gt;</font>.",
    "<b>Author/Team</b>: team page or team keywords + credential keywords.",
    "<b>Experience</b>: years/established, &lsquo;years of experience&rsquo;, awards, testimonials/reviews, case studies, certifications.",
    "<b>Trust</b>: HTTPS protocol, Privacy Policy, Terms &amp; Conditions, review/trust-badge match.",
])

add_basis("Service Content Quality / Content Depth Quality", [
    "<b>Service</b>: best service page &mdash; H1 + word count, benefits keywords / &ge;3 list items, audience text, booking embed/form/CTA, and pre-service sections (process, timeline, pricing, requirements, faq).",
    "<b>Depth</b>: up to 6 typed pages &mdash; relevance signals (brand, location, phone/email, year, dealer name), word count vs per-type threshold (VDP 200, SRP 150, contact 100, &hellip;), and uniqueness via Jaccard similarity on 4-gram fingerprints.",
])

story.append(Paragraph("Local SEO &mdash; the 8 sub-signals", H_PARAM))
story.append(flow_list([
    "<b>LocalBusiness_Schema</b>: from the JSON-LD markup, aggregated across all LocalBusiness + Organization nodes, it fetches <font face='Courier'>name/legalName</font>, <font face='Courier'>address</font>, <font face='Courier'>telephone/phone</font>, <font face='Courier'>geo/latitude/hasMap</font>, <font face='Courier'>openingHours/openingHoursSpecification</font>, and <font face='Courier'>sameAs</font> &mdash; score = present fields / 6.",
    "<b>NAP_Consistency</b>: phone from <font face='Courier'>a[href^=\"tel:\"]</font> + footer phone regex <font face='Courier'>(\\d{3})\\d{3}\\d{4}</font>; name + telephone + address from schema; checks the schema phone matches the on-page phone.",
    "<b>Location_Targeting</b>: resolved city/state checked in 3 zones &mdash; <font face='Courier'>&lt;title&gt;</font>, meta description, and visible <font face='Courier'>&lt;body&gt;</font> text.",
    "<b>Local_Keyword_Usage</b>: scans h1&ndash;h3 + title + body for &lsquo;near me / nearby / in my area / service area / serving / directions / local&rsquo; and counts city mentions.",
    "<b>Local_Landing_Pages</b>: homepage links whose path matches <font face='Courier'>/locations | /store-locator | /stores | /branches | /dealers | /service-areas | /near-me</font>.",
    "<b>Location_Page_Completeness</b>: on the location/contact page &mdash; Google Maps embed/iframe/.map class, opening-hours / day-abbreviation / am-pm patterns, &lsquo;get directions&rsquo; / maps/dir, and a <font face='Courier'>tel:</font> or phone number.",
    "<b>Google_Business_Profile</b> <i>(partial)</i>: anchors or schema <font face='Courier'>sameAs</font> matching <font face='Courier'>g.page | business.google.com | maps/place | maps.app.goo.gl</font>.",
    "<b>Review_Signals</b> <i>(partial)</i>: <font face='Courier'>AggregateRating</font> / <font face='Courier'>ratingValue</font> / <font face='Courier'>Review</font> schema, links to Yelp/Trustpilot/DealerRater/BBB/cars.com/Google reviews, and star-rating widgets (<font face='Courier'>[class*=\"rating\"], [itemprop=\"ratingValue\"]</font>).",
]))

story.append(PageBreak())

# ======================================================================
#  SECTION 7 — FINAL FORMULA
# ======================================================================
story.append(section("7", "Final SEO percentage & key notes", BLUE))
story.append(Spacer(1, 5))
story.append(Paragraph("The 23 weighted parameter scores (0&ndash;100) are multiplied by their weights, summed, then normalized by the total weight (1.06):", BODY))
story.append(Paragraph(
    "weightedScore = &Sigma; ( parameterScore &times; weight ) &nbsp;&nbsp;[Content_Relevance uses .percentage]<br/>"
    "totalWeight = 1.06 &nbsp;(sum of the 23 used weights; Duplicate_Content &amp; URL_Structure excluded)<br/>"
    "<b>SEO Percentage = round( weightedScore / totalWeight )</b>", CODE))

story.append(Paragraph("Worked examples", H_PARAM))
ex_data = [
    ["Scenario", "Calculation", "Result"],
    ["All weighted parameters = 100", "106 / 1.06", "100%"],
    ["Two heaviest (H1 + Content_Relevance, 0.10 each) = 0,\nall others = 100", "(106 − 20) / 1.06", "~81%"],
    ["EEAT (0.08) and Image (0.08) = 0,\nall others = 100", "(106 − 16) / 1.06", "~85%"],
    ["Every parameter scores 50 (all warnings)", "53 / 1.06", "50%"],
    ["Three lightest (Semantic, Video, Social, 0.01 each) = 0,\nall others = 100", "(106 − 3) / 1.06", "~97%"],
]
ext = Table(ex_data, colWidths=[88 * mm, 50 * mm, 32 * mm], repeatRows=1)
ext.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.3),
    ("FONTNAME", (1, 1), (1, -1), "Courier"),
    ("FONTNAME", (2, 1), (2, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (2, 1), (2, -1), GREEN),
    ("ALIGN", (2, 0), (2, -1), "CENTER"),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(ext)

story.append(Spacer(1, 8))
story.append(Paragraph("Things to be aware of", H_PARAM))
notes = [
    "<b>Duplicate_Content (0.02)</b> is a dead weight &mdash; in the weights object but never computed, never in the formula, never returned, and excluded from totalWeight.",
    "<b>URL_Structure</b> is computed and returned but never weighted (no entry in weights).",
    "<b>Content_Relevance</b> is the only metric not wrapped by evaluateParameter &mdash; it is weighted via raw .percentage (before the stuffing penalty); the penalized finalScore is discarded.",
    "<b>Three 0&ndash;10 advanced metrics</b> (Service_Content_Quality, Content_Depth_Quality, Local_SEO) are display-only; among the advanced metrics, only <b>EEAT</b> is weighted.",
    "<b>Two Local SEO sub-signals</b> (Google_Business_Profile, Review_Signals) are explicitly partial &mdash; link-detection only; full accuracy needs the Google Places API.",
    "<b>Structured_Data</b> is presence-only &mdash; it does not validate schema correctness.",
    "The in-code comment says weights &ldquo;sum to 1.0&rdquo;, but the actual totalWeight is <b>1.06</b>. Harmless (the code divides by that exact sum), but the comment is inaccurate.",
]
notebox = Table([[flow_list(notes)]], colWidths=[CONTENT_W])
notebox.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), REDBG),
    ("LINEBEFORE", (0, 0), (0, -1), 3, RED),
    ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#fca5a5")),
    ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(notebox)

story.append(PageBreak())

# ======================================================================
#  SECTION 8 — GLOSSARY
# ======================================================================
story.append(section("8", "Glossary", INDIGO))
story.append(Spacer(1, 5))
story.append(Paragraph("Key terms and techniques referenced in the implementation.", BODY))
gloss = [
    ["Term", "Meaning in this codebase"],
    ["Cheerio", "Server-side jQuery-like HTML parser; the $ selector reads the static (pre-JavaScript) DOM."],
    ["Puppeteer", "Headless Chromium driver; page.evaluate() runs code in the fully rendered page."],
    ["JSON-LD", "JSON Linked Data inside script[type=\"application/ld+json\"] — the structured-data format Google reads."],
    ["evaluateParameter", "Shared helper (line 4) that turns a 0–1 fraction into {score, status, details, analysis}."],
    ["fraction / score", "fraction is the raw 0–1 value; score is round(fraction × 100), stored 0–100."],
    ["status", "pass (=1) / warning (≥0.5) / fail (<0.5), derived from the raw fraction."],
    ["E-E-A-T", "Experience, Expertise, Authoritativeness, Trust — Google’s quality signals, here scored 0–10."],
    ["NAP", "Name, Address, Phone — the core local-business identity that must be consistent."],
    ["Jaccard similarity", "Overlap of two 4-gram fingerprint sets; used to detect near-duplicate page content."],
    ["VDP / SRP", "Vehicle Detail Page / Search Results Page — page types in the content-depth classifier."],
    ["totalWeight", "Sum of the 23 active weights (1.06); the divisor that normalizes the final percentage."],
    ["Effective share", "A parameter’s weight ÷ totalWeight — its true contribution to the SEO score."],
]
gt = Table(gloss, colWidths=[40 * mm, 130 * mm], repeatRows=1)
gt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
    ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0, 1), (0, -1), BLUE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(gt)

story.append(Spacer(1, 12))
story.append(HRFlowable(width="100%", thickness=0.6, color=GREY))
story.append(Paragraph(
    "Generated from <font face='Courier'>Backend/metricServices/seoMetrics.js</font> &mdash; "
    "Auditify On-Page SEO audit. &nbsp;This document is a faithful description of the code as implemented.", META))


# ======================================================================
#  Page furniture
# ======================================================================
def later_pages(canvas, doc):
    canvas.saveState()
    # top accent rule
    canvas.setStrokeColor(BORDERLT)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 285 * mm, 190 * mm, 285 * mm)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(20 * mm, 287 * mm, "AUDITIFY")
    canvas.setFont("Helvetica", 7.5)
    canvas.drawRightString(190 * mm, 287 * mm, "SEO Parameter Implementation")
    # footer
    canvas.setStrokeColor(BORDERLT)
    canvas.line(20 * mm, 14 * mm, 190 * mm, 14 * mm)
    canvas.setFillColor(GREY)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(20 * mm, 10 * mm, f"Generated {DATE}")
    canvas.drawRightString(190 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def first_page(canvas, doc):
    # cover draws its own art; no furniture
    pass


doc = SimpleDocTemplate(OUT, pagesize=A4,
                        leftMargin=20 * mm, rightMargin=20 * mm,
                        topMargin=20 * mm, bottomMargin=18 * mm,
                        title="SEO Parameter Implementation",
                        author="Auditify")
doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
print(f"PDF written to {OUT}")
