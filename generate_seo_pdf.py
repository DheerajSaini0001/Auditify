#!/usr/bin/env python3
"""Generate a detailed SEO parameter implementation PDF for Auditify."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable
)

OUT = "/Users/dheeraj/Desktop/Auditify/SEO_Parameter_Implementation.pdf"

NAVY = colors.HexColor("#1e293b")
BLUE = colors.HexColor("#2563eb")
GREEN = colors.HexColor("#059669")
AMBER = colors.HexColor("#d97706")
RED = colors.HexColor("#dc2626")
GREY = colors.HexColor("#64748b")
LIGHT = colors.HexColor("#f1f5f9")
LIGHTBLUE = colors.HexColor("#eff6ff")

styles = getSampleStyleSheet()

H_TITLE = ParagraphStyle("HTitle", parent=styles["Title"], fontSize=24,
                         textColor=NAVY, spaceAfter=6, leading=28)
H_SUB = ParagraphStyle("HSub", parent=styles["Normal"], fontSize=11,
                       textColor=GREY, spaceAfter=2, alignment=TA_LEFT)
H_SECTION = ParagraphStyle("HSection", parent=styles["Heading1"], fontSize=16,
                           textColor=BLUE, spaceBefore=14, spaceAfter=6, leading=20)
H_PARAM = ParagraphStyle("HParam", parent=styles["Heading2"], fontSize=12.5,
                         textColor=NAVY, spaceBefore=12, spaceAfter=2, leading=16)
META = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=8.5,
                      textColor=GREY, spaceAfter=4, leading=11)
BODY = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.5,
                      leading=13.5, spaceAfter=4)
BULLET = ParagraphStyle("Bullet", parent=styles["Normal"], fontSize=9.5,
                        leading=13, spaceAfter=1)
CODE = ParagraphStyle("Code", parent=styles["Code"], fontSize=8.2,
                      textColor=NAVY, backColor=LIGHT, leading=11,
                      borderPadding=6, spaceBefore=2, spaceAfter=6)
NOTE = ParagraphStyle("Note", parent=styles["Normal"], fontSize=9,
                      leading=12.5, spaceAfter=4, textColor=colors.HexColor("#7c2d12"))


def score_chip(text):
    """Color-code a score keyword inline."""
    return text


def flow_list(items):
    """Build a bulleted list of Paragraphs from (condition, score) tuples or strings."""
    lis = []
    for it in items:
        lis.append(ListItem(Paragraph(it, BULLET), leftIndent=8, value="•"))
    return ListFlowable(lis, bulletType="bullet", start="•",
                        leftIndent=10, bulletFontSize=8, spaceAfter=4)


story = []

# ---------- COVER ----------
story.append(Spacer(1, 8))
story.append(Paragraph("SEO Parameter Implementation", H_TITLE))
story.append(Paragraph("Auditify &mdash; On-Page SEO audit: how every parameter is calculated", H_SUB))
story.append(Paragraph("Source: <font face='Courier'>Backend/metricServices/seoMetrics.js</font> &nbsp;|&nbsp; Entry: <font face='Courier'>seoMetrics(url, $, page)</font> (line 3689)", META))
story.append(HRFlowable(width="100%", thickness=1, color=BLUE, spaceBefore=6, spaceAfter=10))

# ---------- SECTION 1: scoring model ----------
story.append(Paragraph("1. How each parameter is scored", H_SECTION))
story.append(Paragraph(
    "Every check produces a <b>fraction between 0 and 1</b> (common values: 0, 0.5, 0.7, 1). "
    "A shared helper <font face='Courier'>evaluateParameter(score, details, meta)</font> converts it:", BODY))
story.append(Paragraph(
    "score = round(fraction &times; 100) &nbsp;&bull;&nbsp; "
    "status = (fraction == 1 &rarr; <font color='#059669'><b>pass</b></font>) , "
    "(fraction &ge; 0.5 &rarr; <font color='#d97706'><b>warning</b></font>) , "
    "(fraction &lt; 0.5 &rarr; <font color='#dc2626'><b>fail</b></font>)", CODE))
story.append(Paragraph(
    "Data sources used: <b>Cheerio</b> (parsed HTML DOM), <b>Puppeteer</b> <font face='Courier'>page.evaluate()</font>, "
    "and direct <b>HTTP fetch</b> (HEAD/GET). No external PageSpeed/Lighthouse API is used here.", BODY))

# ---------- SECTION 2: weights table ----------
story.append(Paragraph("2. Weights &amp; share of the SEO score", H_SECTION))
story.append(Paragraph(
    "23 parameters are weighted into the SEO percentage. Their weights sum to <b>1.06</b> "
    "(<font face='Courier'>totalWeight</font>); the score is divided by that sum, so the "
    "&ldquo;Share&rdquo; column is each parameter&rsquo;s true contribution.", BODY))

weights_data = [
    ["Parameter (key)", "Weight", "Share", "Source", "Status"],
    ["H1", "0.10", "9.43%", "Cheerio", "Full"],
    ["Content_Relevance", "0.10", "9.43%", "Cheerio", "Full*"],
    ["Image", "0.08", "7.55%", "Cheerio + HTTP HEAD", "Full"],
    ["Canonical", "0.08", "7.55%", "Cheerio", "Full"],
    ["Contextual_Linking", "0.08", "7.55%", "Cheerio + HTTP GET", "Full"],
    ["EEAT", "0.08", "7.55%", "Page fetch + regex", "Full"],
    ["Structured_Data", "0.06", "5.66%", "Puppeteer", "Full (presence)"],
    ["Meta_Description", "0.05", "4.72%", "Cheerio", "Full"],
    ["Sitemap", "0.05", "4.72%", "HTTP fetch", "Full"],
    ["Title", "0.04", "3.77%", "Cheerio", "Full"],
    ["Title_Uniqueness", "0.04", "3.77%", "Multi-page HTTP", "Full"],
    ["Title_Keyword_Optimization", "0.04", "3.77%", "Multi-page HTTP", "Full"],
    ["Robots_Txt", "0.04", "3.77%", "HTTP fetch", "Full"],
    ["Title_Location_Optimization", "0.03", "2.83%", "Schema/footer/contact", "Full"],
    ["Meta_Description_Uniqueness", "0.03", "2.83%", "Multi-page HTTP", "Full"],
    ["Heading_Hierarchy", "0.03", "2.83%", "Cheerio", "Full"],
    ["URL_Slugs", "0.03", "2.83%", "URL parsing", "Full"],
    ["Links", "0.03", "2.83%", "Cheerio", "Full"],
    ["Open_Graph", "0.02", "1.89%", "Cheerio", "Full"],
    ["Twitter_Card", "0.02", "1.89%", "Cheerio", "Full"],
    ["Semantic_Tags", "0.01", "0.94%", "Cheerio", "Full"],
    ["Video", "0.01", "0.94%", "Cheerio", "Full"],
    ["Social_Links", "0.01", "0.94%", "Cheerio", "Full"],
    ["TOTAL (weighted)", "1.06", "100%", "", ""],
]
wt = Table(weights_data, colWidths=[52*mm, 16*mm, 16*mm, 44*mm, 28*mm], repeatRows=1)
wt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, -1), 8),
    ("FONTNAME", (0, 1), (0, -1), "Courier"),
    ("FONTSIZE", (0, 1), (0, -1), 7.5),
    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, LIGHT]),
    ("BACKGROUND", (0, -1), (-1, -1), LIGHTBLUE),
    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ("TEXTCOLOR", (0, -1), (-1, -1), BLUE),
    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 2.5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
    ("LEFTPADDING", (0, 0), (-1, -1), 4),
]))
story.append(wt)
story.append(Paragraph("* Content_Relevance is weighted using its raw <font face='Courier'>.percentage</font>, not the standard <font face='Courier'>.score</font> (see Section 5).", META))

story.append(Spacer(1, 4))
story.append(Paragraph(
    "<b>Display-only</b> (computed and returned, but NOT in the percentage): "
    "<font face='Courier'>URL_Structure</font>, <font face='Courier'>Service_Content_Quality</font>, "
    "<font face='Courier'>Content_Depth_Quality</font>, <font face='Courier'>Local_SEO</font>.", BODY))
story.append(Paragraph(
    "<b>Dead weight:</b> <font face='Courier'>Duplicate_Content: 0.02</font> exists in the weights object but is never "
    "computed, never in the formula, and never returned.", BODY))

story.append(PageBreak())

# ---------- SECTION 3: per-parameter flow ----------
story.append(Paragraph("3. Per-parameter implementation flow", H_SECTION))
story.append(Paragraph(
    "Each parameter below shows the exact decision flow the code follows, in order, with the score it assigns at each branch.", BODY))


def add_param(num, title, meta_line, intro, branches, code=None):
    story.append(Paragraph(f"{num}. {title}", H_PARAM))
    story.append(Paragraph(meta_line, META))
    if intro:
        story.append(Paragraph(intro, BODY))
    if branches:
        story.append(flow_list(branches))
    if code:
        story.append(Paragraph(code, CODE))


P = "<font color='#059669'><b>PASS (1.0)</b></font>"
W = "<font color='#d97706'><b>WARN (0.5)</b></font>"
W7 = "<font color='#d97706'><b>WARN (0.7)</b></font>"
F = "<font color='#dc2626'><b>FAIL (0.0)</b></font>"

add_param("3.1", "Title &mdash; <font face='Courier'>Title</font>", "Weight 0.04 &bull; Cheerio <font face='Courier'>$(\"title\")</font> &bull; checkTitle()",
    "Does a &lt;title&gt; tag exist? If yes, measure its text length and branch:",
    [
        f"&lt;title&gt; tag missing &rarr; {F}",
        f"Tag exists but text length == 0 (empty) &rarr; {F}",
        f"Length &lt; 30 characters (too short) &rarr; {W}",
        f"Length &gt; 60 characters (too long, may truncate in SERP) &rarr; {W}",
        f"Length 30&ndash;60 characters (optimal) &rarr; {P}",
    ])

add_param("3.2", "Meta Description &mdash; <font face='Courier'>Meta_Description</font>", "Weight 0.05 &bull; Cheerio <font face='Courier'>meta[name=description]</font> &bull; checkMetaDescription()",
    "Does the meta description tag exist? If yes, measure the <font face='Courier'>content</font> length:",
    [
        f"Tag missing &rarr; {F}",
        f"Tag exists but content length == 0 &rarr; {F}",
        f"Length &lt; 50 characters (too short) &rarr; {W}",
        f"Length &gt; 160 characters (too long) &rarr; {W}",
        f"Length 50&ndash;160 characters (optimal) &rarr; {P}",
    ])

add_param("3.3", "H1 &mdash; <font face='Courier'>H1</font>", "Weight 0.10 &bull; Cheerio <font face='Courier'>$(\"h1\")</font> &bull; checkH1()",
    "Count the &lt;h1&gt; tags on the page:",
    [
        f"0 H1 tags (missing) &rarr; {W} &nbsp;<i>(note: a warning, not a hard fail)</i>",
        f"Exactly 1 H1 but its text is empty &rarr; {W}",
        f"Exactly 1 H1 with text &rarr; {P}",
        f"More than 1 H1 tag &rarr; {W}",
    ])

add_param("3.4", "Canonical &mdash; <font face='Courier'>Canonical</font>", "Weight 0.08 &bull; Cheerio <font face='Courier'>link[rel=canonical]</font> &bull; checkCanonical()",
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

add_param("3.5", "Image &mdash; <font face='Courier'>Image</font>", "Weight 0.08 &bull; Cheerio <font face='Courier'>$(\"img\")</font> + HTTP HEAD (up to 15 unique srcs) &bull; checkImages()",
    "If there are no images &rarr; score 1.0. Otherwise a weighted composite is built from four sub-scores:",
    [
        "<b>altScore</b> = images with alt text / total &nbsp;(weight 0.5)",
        "<b>meaningfulScore</b> = images with non-generic alt (&ge;2 words or &gt;5 chars, not in a blocklist like &lsquo;logo/icon/image&rsquo;) / total &nbsp;(weight 0.2)",
        "<b>titleScore</b> = images with a title attribute / total &nbsp;(weight 0.1)",
        "<b>sizeScore</b> = 1 &minus; 0.1 per image &gt;150KB (HTTP HEAD content-length) &nbsp;(weight 0.2)",
    ],
    "weightedScore = altScore&times;0.5 + meaningfulScore&times;0.2 + titleScore&times;0.1 + sizeScore&times;0.2<br/>"
    "if (score &lt; 0.5) score = 0.5 (floor) &nbsp;&bull;&nbsp; if any broken image (bad HTTP/Content-Type) &rarr; score forced to 0.5")

add_param("3.6", "Video &mdash; <font face='Courier'>Video</font>", "Weight 0.01 &bull; Cheerio <font face='Courier'>video, iframe[youtube|vimeo]</font> &bull; checkVideos()",
    "If there are no videos &rarr; score 1.0. Otherwise average three sub-scores:",
    [
        "<b>embedScore</b> = 1 (always, embedding is present)",
        "<b>lazyScore</b> = videos with loading=&lsquo;lazy&rsquo; (or .lazy class) / total",
        "<b>metaScore</b> = videos with itemprop metadata / total",
    ],
    "score = (embedScore + lazyScore + metaScore) / 3")

add_param("3.7", "Heading Hierarchy &mdash; <font face='Courier'>Heading_Hierarchy</font>", "Weight 0.03 &bull; Cheerio <font face='Courier'>h1..h6</font> &bull; checkHeadingHierarchy()",
    "Start at score 1, then apply penalties based on heading structure:",
    [
        f"No headings at all on the page &rarr; {F}",
        f"Multiple H1 tags &rarr; {W}",
        f"Any skipped level (e.g. H2 &rarr; H4) or missing H1 &rarr; {W}",
        f"Single H1 and no skipped levels &rarr; {P}",
    ])

add_param("3.8", "Semantic Tags &mdash; <font face='Courier'>Semantic_Tags</font>", "Weight 0.01 &bull; Cheerio <font face='Courier'>main, nav, header, footer, &hellip;</font> &bull; checkSemanticTags()",
    "Checks for HTML5 landmark tags, in order:",
    [
        f"&lt;main&gt; missing OR more than one &lt;main&gt; &rarr; {W}",
        f"Missing any of &lt;header&gt; / &lt;nav&gt; / &lt;footer&gt; &rarr; {W}",
        f"Only &lt;main&gt; present and NO div-class heuristic replacements found &rarr; {F} (severe, div-only layout)",
        f"Only &lt;main&gt; present but div replacements detected &rarr; {W}",
        f"All major semantic tags properly used &rarr; {P}",
    ])

add_param("3.9", "Links &mdash; <font face='Courier'>Links</font>", "Weight 0.03 &bull; Cheerio <font face='Courier'>$(\"a\")</font> (no network) &bull; checkLinks()",
    "Counts internal/external/unique links and inspects anchor text. <font face='Courier'>descRatio = descriptive anchors / total</font>.",
    [
        f"Any generic anchors (&lsquo;click here&rsquo;, &lsquo;read more&rsquo;, &lsquo;here&rsquo;&hellip;) OR descRatio &lt; 0.75 &rarr; {W}",
        f"Otherwise (descriptive anchors, no generic text) &rarr; {P}",
    ])

add_param("3.10", "URL Slugs &mdash; <font face='Courier'>URL_Slugs</font>", "Weight 0.03 &bull; URL parsing only &bull; checkSlugs()",
    "Examines the last path segment of the URL:",
    [
        f"Root URL (&lsquo;/&rsquo; or empty path) &rarr; {P}",
        "Penalty triggers (any one &rarr; warning): last segment &gt;50 chars; contains uppercase; contains underscores; contains numbers when path depth &gt; 2",
        f"Any penalty triggered &rarr; {W}",
        f"Clean slug (no penalties) &rarr; {P}",
    ])

add_param("3.11", "Contextual Linking &mdash; <font face='Courier'>Contextual_Linking</font>", "Weight 0.08 &bull; Cheerio + HTTP GET (up to 150 links) &bull; checkContextualLinks()",
    "Extracts in-content links (vs nav/menu links), computes ratio = contextual / (contextual + menu). Start at score 1, drop to 0.5 if any condition hits:",
    [
        f"Zero contextual links in main content &rarr; {W}",
        f"More than 100 contextual links (spam risk) &rarr; {W}",
        f"Ratio &lt; 0.3 (most links are navigation) &rarr; {W}",
        f"More than 5 important menu pages not linked contextually &rarr; {W}",
        f"Any broken contextual link (HTTP GET fails; links containing &lsquo;inventory&rsquo; are skipped) &rarr; {W}",
        f"None of the above &rarr; {P}",
    ])

add_param("3.12", "Content Relevance &mdash; <font face='Courier'>Content_Relevance</font>", "Weight 0.10 &bull; Cheerio body text vs title+meta keywords &bull; checkContentRelevance()",
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

add_param("3.13", "Robots.txt &mdash; <font face='Courier'>Robots_Txt</font>", "Weight 0.04 &bull; HTTP fetch <font face='Courier'>/robots.txt</font> (Puppeteer-first, node-fetch fallback) &bull; checkRobotsTxt()",
    "Fetch /robots.txt, then evaluate the <font face='Courier'>User-agent: *</font> block:",
    [
        f"File missing (HTTP &ge; 400 and no content) &rarr; {W}",
        f"File present but empty &rarr; {W}",
        f"Full-site block &mdash; <font face='Courier'>Disallow: /</font> &rarr; {F}",
        f"Query params blocked &mdash; <font face='Courier'>Disallow: /*?</font> &rarr; {W7}",
        f"Otherwise (valid, not fully blocked) &rarr; {P}",
    ])

add_param("3.14", "Sitemap &mdash; <font face='Courier'>Sitemap</font>", "Weight 0.05 &bull; HTTP fetch (robots-declared + /sitemap.xml + /sitemap_index.xml) &bull; checkSitemap()",
    "Try each candidate sitemap URL until one loads, then validate:",
    [
        f"No sitemap found anywhere &rarr; {W}",
        f"Found but invalid structure (no &lt;urlset&gt; / &lt;sitemapindex&gt;) &rarr; {F}",
        f"Valid but no &lt;lastmod&gt; at all, OR any lastmod older than 180 days &rarr; {W} (outdated)",
        f"Valid and fresh &rarr; {P}",
    ])

add_param("3.15", "Structured Data &mdash; <font face='Courier'>Structured_Data</font>", "Weight 0.06 &bull; Puppeteer <font face='Courier'>script[type=application/ld+json]</font> &bull; checkStructuredData()",
    "Parses all JSON-LD blocks (presence check only &mdash; it does NOT validate schema correctness):",
    [
        f"At least one valid JSON-LD block present &rarr; {P}",
        f"No JSON-LD found &rarr; {W}",
        f"Parse/page error &rarr; {F}",
    ])

add_param("3.16", "Open Graph &mdash; <font face='Courier'>Open_Graph</font>", "Weight 0.02 &bull; Cheerio <font face='Courier'>meta[property=og:*]</font> &bull; checkSocial()",
    "Checks required Open Graph tags: <font face='Courier'>og:title, og:image, og:url</font>.",
    [
        f"All three required OG tags present &rarr; {P}",
        f"Any required OG tag missing &rarr; {W}",
    ])

add_param("3.17", "Twitter Card &mdash; <font face='Courier'>Twitter_Card</font>", "Weight 0.02 &bull; Cheerio twitter meta tags &bull; checkSocial()",
    "Checks required Twitter Card tags: <font face='Courier'>twitter:card, twitter:title</font>.",
    [
        f"Both required Twitter tags present &rarr; {P}",
        f"Either missing &rarr; {W}",
    ])

add_param("3.18", "Social Links &mdash; <font face='Courier'>Social_Links</font>", "Weight 0.01 &bull; Cheerio <font face='Courier'>$(\"a\")</font> vs social-domain list &bull; checkSocial()",
    "Scans all anchors for links to known social domains (facebook, x/twitter, linkedin, instagram, youtube, &hellip;).",
    [
        f"At least one social profile link found &rarr; {P}",
        f"No social links found &rarr; {W}",
    ])

# ---- multi-page / advanced ----
add_param("3.19", "Title Uniqueness &mdash; <font face='Courier'>Title_Uniqueness</font>", "Weight 0.04 &bull; Multi-page HTTP (up to 5 internal pages) &bull; checkTitleUniqueness() &rarr; tuScoreUniqueness()",
    "Samples up to 5 eligible internal pages (sitemap first, else homepage crawl) and fetches each page&rsquo;s &lt;title&gt; once.",
    [
        f"Sample failed / no eligible pages (<font face='Courier'>!sample.ok</font>) &rarr; {W} (inconclusive)",
        f"All sampled titles missing (foundCount == 0) &rarr; {F}",
        "Otherwise: <b>score = uniqueCount / pagesChecked</b> (distinct case-insensitive titles &divide; total pages sampled; missing values dilute the score)",
    ])

add_param("3.20", "Meta Description Uniqueness &mdash; <font face='Courier'>Meta_Description_Uniqueness</font>", "Weight 0.03 &bull; Multi-page HTTP (same 5-page sample) &bull; checkMetaDescriptionUniqueness() &rarr; tuScoreUniqueness()",
    "Identical logic to Title Uniqueness, applied to the meta description field:",
    [
        f"Sample failed &rarr; {W} (inconclusive)",
        f"All descriptions missing &rarr; {F}",
        "Otherwise: <b>score = uniqueCount / pagesChecked</b>",
    ])

add_param("3.21", "Title Keyword Optimization &mdash; <font face='Courier'>Title_Keyword_Optimization</font>", "Weight 0.04 &bull; Multi-page HTTP &bull; checkTitleKeywordOptimization()",
    "For each sampled page, derives a target keyword and checks whether the page&rsquo;s &lt;title&gt; contains it. Keyword derivation cascade: (1) URL slug &rarr; (2) H1 first 3 tokens &rarr; (3) top-2 most frequent content words.",
    [
        f"Sample failed (<font face='Courier'>!sample.ok</font>) &rarr; {W} (inconclusive)",
        "Otherwise: <b>score = optimizedCount / pagesChecked</b> (titles containing their derived keyword &divide; pages). Match = keyword token, or its &ge;4-char stem, is a substring of the title.",
    ])

add_param("3.22", "Title Location Optimization &mdash; <font face='Courier'>Title_Location_Optimization</font>", "Weight 0.03 &bull; Schema &rarr; footer &rarr; contact page &rarr; body &bull; checkTitleLocationOptimization()",
    "Resolves the business city/state using a cascade (first hit wins): (1) JSON-LD schema address, (2) footer text, (3) fetched contact page, (4) whole-page body text. Then checks whether the title mentions that location.",
    [
        f"Location cannot be determined (no city and no state) &rarr; {W} (inconclusive)",
        f"Title mentions the resolved city / state / state-abbreviation &rarr; {P}",
        f"Location resolved but title does NOT mention it &rarr; {F}",
    ])

add_param("3.23", "E-E-A-T &mdash; <font face='Courier'>EEAT</font>", "Weight 0.08 &bull; Trust-page discovery + fetch (cap 5) + regex &bull; checkEEAT()",
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

# ---------- SECTION 4: display-only ----------
story.append(Paragraph("4. Display-only parameters (returned, not scored)", H_SECTION))
story.append(Paragraph(
    "These are fully computed and returned in the response, but are NOT part of the weighted SEO percentage.", BODY))

add_param("4.1", "URL Structure &mdash; <font face='Courier'>URL_Structure</font>", "Display-only &bull; URL parsing &bull; checkURLStructure()",
    "Penalizes: uppercase in path, underscores, query parameters, depth &gt; 3 segments.",
    [
        f"Any issue &rarr; {W} &nbsp; / &nbsp; No issues &rarr; {P}",
        "Has no entry in the weights object &rarr; never affects the score (only <font face='Courier'>URL_Slugs</font> is weighted).",
    ])

add_param("4.2", "Service Content Quality &mdash; <font face='Courier'>Service_Content_Quality</font>", "Display-only (0&ndash;10) &bull; Service-page fetch &bull; checkServiceContentQuality()",
    "Finds the best service page, scores four sub-checks 0&ndash;2 each (raw 0&ndash;8). Returns 0 if no service page / page fails to load.",
    [
        "<b>Description (0&ndash;2):</b> of {H1 + &ge;40 words, benefits keywords or &ge;3 list items, target-audience text}: &ge;2 &rarr; 2; 1 &rarr; 1; else 0",
        "<b>Content length (0&ndash;2):</b> &ge;150 words &rarr; 2; &ge;75 &rarr; 1; else 0",
        "<b>Booking (0&ndash;2):</b> booking embed/form/CTA &rarr; 2; any form &rarr; 1; else 0",
        "<b>Pre-service info (0&ndash;2):</b> of {process, timeline, pricing, requirements, faq}: &ge;2 &rarr; 2; 1 &rarr; 1; else 0",
    ],
    "rawScore = sum of 4 (0&ndash;8) &nbsp;&bull;&nbsp; fraction = rawScore / 8")

add_param("4.3", "Content Depth Quality &mdash; <font face='Courier'>Content_Depth_Quality</font>", "Display-only (0&ndash;10) &bull; Up to 6 typed pages &bull; checkContentDepthQuality()",
    "Classifies and fetches up to 6 typed pages (SRP/VDP/Service/Trade-In/About/Contact). Each page scored on three 0&ndash;2 checks, then per-page scores averaged. No targets &rarr; 0.5 (inconclusive).",
    [
        "<b>Relevance (0&ndash;2):</b> of 5 signals {brand, location, phone/email, year, dealer name}: &ge;3 &rarr; 2; &ge;1 &rarr; 1; else 0 (capped at 1 if type-mandatory mentions are missing)",
        "<b>Depth (0&ndash;2):</b> word count vs per-type threshold (e.g. VDP 200, SRP 150, contact 100): &ge;threshold &rarr; 2; &ge;60% &rarr; 1; else 0",
        "<b>Uniqueness (0&ndash;2):</b> max Jaccard similarity (4-gram fingerprint) vs other pages: &lt;0.30 &rarr; 2; 0.30&ndash;0.60 &rarr; 1; &gt;0.60 &rarr; 0",
    ],
    "per-page raw = relevance + depth + uniqueness (0&ndash;6) &rarr; score10 &nbsp;&bull;&nbsp; final = mean of per-page score10, &divide;10")

add_param("4.4", "Local SEO &mdash; <font face='Courier'>Local_SEO</font>", "Display-only (0&ndash;100, avg of 8 sub-signals) &bull; checkLocalSEO()",
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

# ---------- SECTION 5: basis ----------
story.append(Paragraph("5. Basis &mdash; exactly what each check fetches / inspects", H_SECTION))
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

story.append(Paragraph("Local SEO &mdash; the 8 sub-signals (this is the basis you asked about)", H_PARAM))
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

# ---------- SECTION 6: final formula + notes ----------
story.append(Paragraph("6. Final SEO percentage &amp; key notes", H_SECTION))
story.append(Paragraph("The 23 weighted parameter scores (0&ndash;100) are multiplied by their weights, summed, then normalized by the total weight (1.06):", BODY))
story.append(Paragraph(
    "weightedScore = &Sigma; ( parameterScore &times; weight ) &nbsp;&nbsp;[Content_Relevance uses .percentage]<br/>"
    "totalWeight = 1.06 &nbsp;(sum of the 23 used weights; Duplicate_Content &amp; URL_Structure excluded)<br/>"
    "<b>SEO Percentage = round( weightedScore / totalWeight )</b>", CODE))
story.append(Paragraph(
    "<b>Worked example:</b> if all weighted parameters scored 100 &rarr; weightedScore = 106 &rarr; 106 / 1.06 = <b>100%</b>. "
    "If H1 and Content_Relevance (the two heaviest, 0.10 each) were 0 and the rest 100 &rarr; (106 &minus; 20) / 1.06 = <b>~81%</b>.", BODY))

story.append(Spacer(1, 6))
story.append(Paragraph("Things to be aware of", H_PARAM))
story.append(flow_list([
    "<b>Duplicate_Content (0.02)</b> is a dead weight &mdash; in the weights object but never computed, never in the formula, never returned, and excluded from totalWeight.",
    "<b>URL_Structure</b> is computed and returned but never weighted (no entry in weights).",
    "<b>Content_Relevance</b> is the only metric not wrapped by evaluateParameter &mdash; it is weighted via raw .percentage (before the stuffing penalty); the penalized finalScore is discarded.",
    "<b>Three 0&ndash;10 advanced metrics</b> (Service_Content_Quality, Content_Depth_Quality, Local_SEO) are display-only; among the advanced metrics, only <b>EEAT</b> is weighted.",
    "<b>Two Local SEO sub-signals</b> (Google_Business_Profile, Review_Signals) are explicitly partial &mdash; link-detection only; full accuracy needs the Google Places API.",
    "<b>Structured_Data</b> is presence-only &mdash; it does not validate schema correctness.",
    "The in-code comment says weights &ldquo;sum to 1.0&rdquo;, but the actual totalWeight is <b>1.06</b>. Harmless (the code divides by that exact sum), but the comment is inaccurate.",
]))

story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=0.6, color=GREY))
story.append(Paragraph("Generated from Backend/metricServices/seoMetrics.js &mdash; Auditify On-Page SEO audit.", META))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(20 * mm, 12 * mm, "Auditify &mdash; SEO Parameter Implementation".replace("&mdash;", "—"))
    canvas.drawRightString(190 * mm, 12 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = SimpleDocTemplate(OUT, pagesize=A4,
                        leftMargin=20 * mm, rightMargin=20 * mm,
                        topMargin=16 * mm, bottomMargin=18 * mm,
                        title="SEO Parameter Implementation",
                        author="Auditify")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"PDF written to {OUT}")
