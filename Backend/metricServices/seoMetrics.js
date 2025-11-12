import axios from "axios";
import SiteReport from "../models/SiteReport.js";

// On-Page SEO (Essentials) 
function checkURLStructure(url) {
  try {
    const { pathname } = new URL(url);
    
    // Rule 1: Short and readable (less than 5 segments)
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 5) return 0;
    
    // Rule 2: Only contains lowercase letters, numbers, and hyphens
    const validChars = segments.every(seg => /^[a-z0-9-]+$/.test(seg));
    if (!validChars) return 0;

    // Rule 3: No underscores, spaces, or other separators
    const noUnderscore = segments.every(seg => !seg.includes('_'));
    if (!noUnderscore) return 0;

    // Rule 4: Reasonably short segments (less than 30 chars each)
    const shortSegments = segments.every(seg => seg.length <= 30);
    if (!shortSegments) return 0;

    return 1; // All rules passed
  } catch (err) {
    return 0; // Invalid URL
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let hostname = u.hostname.toLowerCase();
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);
    const path = u.pathname.replace(/\/$/, "");
    return hostname + path;
  } catch {
    return null;
  }
}
function isValidCanonical(canonical, pageUrl) {
  const c = normalizeUrl(canonical);
  const p = normalizeUrl(pageUrl);
  return c && p && c === p;
}

// On-Page SEO (Media & Semantics) 
function imagePresence($){
  const images = $("img").toArray();
  return images.length > 0 ? 1 : 0 ;
}

const imageAltScore = ($) => {
  const images = $("img").toArray();
  const imagesWithAlt = images.filter((img) => {
    const alt = $(img).attr("alt");
    return alt !== undefined && alt.trim() !== "";
  });
  
  const percentage = (imagesWithAlt.length / images.length) * 100;
  return percentage > 75 ? 1 : 0;
};

const meaningfulAltScore = ($) => {
  const images = $("img").toArray();
  if (images.length === 0) return 0;
  
  const meaningfulAlts = images.filter((img) => {
    const alt = $(img).attr("alt")?.trim().toLowerCase() || "";
    const meaningless = ["", "image", "logo", "icon", "pic", "picture", "photo", " ", "12345", "-", "graphics"];
    return !meaningless.includes(alt);
  });
  
  const percentage = (meaningfulAlts.length / images.length) * 100;
  return percentage > 75 ? 1 : 0;
};

const checkImagesSize = async ($) => {
  const images = $("img").toArray();

  if (images.length === 0) return 0; // No images

  let totalScore = 0;

  for (const img of images) {
    const src = $(img).attr("src");
    if (!src) continue;

    try {
      // Fetch the image as arraybuffer to get size
      const res = await axios.get(src, { responseType: "arraybuffer" });
      const sizeInKB = res.data.byteLength / 1024;

      // Score 1 if < 200KB else 0
      totalScore += sizeInKB < 200 ? 1 : 0;
    } catch (err) {
      // If image fails to load, consider score 0
      totalScore += 0;
    }
  }

  // Average % of images under 200KB
  const averageScore = (totalScore / images.length) * 100;

  return averageScore.toFixed(2); // e.g., "75.00"
};

const checkVideoExistance = ($) => {
  const videos = $("video, iframe[src*='youtube'], iframe[src*='vimeo']").toArray();
  return videos.length == 0 ? 0 : 1; 
};

const checkVideoEmbedding = ($) => {
  const videos = $("video, iframe[src*='youtube'], iframe[src*='vimeo']").toArray();
  return videos.length > 0 ? 1 : 0; // 1 = properly embedded, 0 = none
};

const checkLazyLoading = ($) => {
  const videos = $("video, iframe").toArray();
  if (videos.length === 0) return 1;

  const lazyLoaded = videos.filter((el) => $(el).attr("loading") === "lazy").length;
  return lazyLoaded / videos.length >= 0.5 ? 1 : 0; 
  // score 1 if ≥50% of videos are lazy loaded
};

const checkStructuredMetadata = ($) => {
  const scripts = $("script[type='application/ld+json']").toArray();
  if (scripts.length === 0) return 1;
  for (const script of scripts) {
    try {
      const data = JSON.parse($(script).html());
      if (Array.isArray(data)) {
        if (data.some((d) => d["@type"] === "VideoObject")) return 1;
      } else if (data["@type"] === "VideoObject") return 1;
    } catch (err) {
      continue;
    }
  }
  return 0;
};

const checkHierarchy = (headings) => {
  let lastLevel = 0;
  for (const h of headings) {
    const currentLevel = parseInt(h.tag[1]); // h1 -> 1, h2 -> 2
    if (lastLevel && currentLevel > lastLevel + 1) {
      return 0; // hierarchy broken
    }
    lastLevel = currentLevel;
  }
  return 1; // hierarchy okay
};

const altTextSEOScore =  ($, keywords = []) => {
  try {
    const images = $("img").toArray();
    const totalImages = images.length;
    if (totalImages === 0) return 0;

    const goodAlts = images.filter(img => {
      const alt = $(img).attr("alt")?.trim().toLowerCase() || "";

      // Skip meaningless or generic alt text
      const meaningless = [
        "", "image", "logo", "icon", "pic", "picture", "photo", " ",
        "12345", "-", "graphics"
      ];
      if (meaningless.includes(alt)) return false;

      // Check if alt contains any keyword (if provided)
      if (keywords.length > 0) {
        return keywords.some(kw => alt.includes(kw.toLowerCase()));
      }

      return true; // descriptive even without keyword
    });

    const percentage = (goodAlts.length / totalImages) * 100;
    return percentage.toFixed(2);
  } catch (err) {
    console.error("Error fetching page:", err.message);
    return 0;
  }
};

const checkInternalLinks = async ($, url, links) => {
  try {
    const domain = new URL(url).hostname;

    // Filter internal links
    const internalLinks = links.filter(link => {
      const href = $(link).attr("href");
      if (!href) return false; // Skip links without href
      try {
        const linkUrl = new URL(href, url); // Resolve relative URLs
        return linkUrl.hostname === domain;
      } catch {
        return false;
      }
    });

    if (internalLinks.length === 0) return { totalInternal: 0, descriptiveScore: 0 };

    // Check descriptive anchor text
    const genericAnchors = ["click here", "read more", "learn more", "details", "link", "more", "go", "this"];
    const descriptiveLinks = internalLinks.filter(link => {
      const text = $(link).text().trim().toLowerCase();
      return text.length > 0 && !genericAnchors.includes(text);
    });

    // Score: 1 if >75% internal links have descriptive text
    const descriptiveScore = (descriptiveLinks.length / internalLinks.length) * 100 > 75 ? 1 : 0;

    return { totalInternal: internalLinks.length, descriptiveScore };
  } catch (err) {
    console.error("Error checking internal links:", err);
    return { totalInternal: 0, descriptiveScore: 0 };
  }
};

const checkSemanticTags = async ($) => {
  try {
    const tags = ["article", "section", "header", "footer"];
    const result = {};

    tags.forEach(tag => {
      result[tag] = $(tag).length > 0 ? 1 : 0; // 1 if tag exists, else 0
    });

    return result;
  } catch (err) {
    console.error("Error checking semantic tags:", err);
    return { article: 0, section: 0, header: 0, footer: 0 };
  }
};

// On-Page SEO (Structure & Uniqueness) 
function extractText($) {
  return $("body").text().replace(/\s+/g, " ").trim();
}
function simpleDuplicateCheck(text) {
    const words = text.split(/\s+/);
    const wordCounts = {};
    let duplicates = 0;

    words.forEach(word => {
        word = word.toLowerCase(); 
        if (wordCounts[word]) {
            duplicates++;
        } else {
            wordCounts[word] = 1;
        }
    });

    const duplicationPercent = (duplicates / words.length) * 100;
    const score = duplicationPercent <=75  ? 1 : 0;
    return score;
}

function getSlug(url) {
  try {
    const pathname = new URL(url).pathname; // get path
    const parts = pathname.split('/').filter(Boolean); // remove empty parts
    return parts.length ? parts[parts.length - 1] : null; // last part is slug
  } catch (err) {
    return null; // invalid URL
  }
}
function slugCheck(url) {
  try {
    const pathname = new URL(url).pathname; // get path
    const parts = pathname.split('/').filter(Boolean); // remove empty parts
    return parts.length > 0 ? 1 : 0; // last part is slug
  } catch (err) {
    return null; // invalid URL
  }
}
function slugValid(slug){
  if (slug.length > 25) return 0;       // length check
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // pattern check
  return regex.test(slug) ? 1 : 0;

}

const checkHTTPS = (url) => {
  try {
    const parsedUrl = new URL(url);
    // Check if protocol is https
    return parsedUrl.protocol === 'https:' ? 1 : 0;
  } catch (error) {
    // Invalid URL
    return 0;
  }
};

function checkPagination($) {
  try {
    // Look for common pagination patterns
    const pagination = $(
      "a[rel='next'], a[rel='prev'], .pagination, .pager, .page-numbers"
    );

    // Also check anchor text manually (case-insensitive)
    const textBased = $("a").filter((i, el) => {
      const txt = $(el).text().toLowerCase();
      return txt.includes("next") || txt.includes("previous");
    });

    return (pagination.length + textBased.length) > 0 ? 0 : 1;
  } catch (err) {
    console.error("Error:", err.message);
    return 0;
  }
}

export default async function seoMetrics(url,device,selectedMetric, $, auditId) {

// On-Page SEO (Essentials) 
const title = $("title").text().trim() || "";
const titleExistanceScore = $("title") ? 1 : 0;
const titleLength = title.length;
const titleScore = titleLength >= 30 && titleLength <= 60 ? 1 : 0 ; 

const metaDesc = $('meta[name="description"]').attr("content") || "";
const metaDescExistanceScore = $('meta[name="description"]') ? 1 : 0;
const metaDescLength = metaDesc.length;
const metaDescScore = metaDescLength <= 165 ? 1 : 0 ;

const URLStructureScore = checkURLStructure(url);

const canonical = $('link[rel="canonical"]').attr("href") || "";
const canonicalExistanceScore = $('link[rel="canonical"]') ? 1 : 0 ;
const canonicalScore = isValidCanonical(canonical, url) ? 1 : 0; 

// On-Page SEO (Media & Semantics) 
const h1Count = $("h1").length;
const h2Count = $("h2").length;
const h3Count = $("h3").length;
const h4Count = $("h4").length;
const h5Count = $("h5").length;
const h6Count = $("h6").length;
const h1CountScore = h1Count === 0 ? 0 : h1Count=== 1 ? 1 : 0 ;
const h1Score = h1Count === 0 ? 0 : h1Count=== 1 ? 1 : 2 ;

const imagePresenceScore = imagePresence($);

let altPresence;
let altMeaningfullPercentage;
let imageCompressionScore ;
let compressionScore = await checkImagesSize($);

if(imagePresenceScore==0){
  altPresence=1
  altMeaningfullPercentage=1
  imageCompressionScore=1
  // console.log("image is absent",altPresence,altMeaningfullPercentage,imageCompressionScore);
}
else{
  altPresence= imageAltScore($) < 75 ? 1 : 0;
  altMeaningfullPercentage= meaningfulAltScore($) < 75 ? 1 : 0;
  imageCompressionScore =compressionScore > 75 ? 1 : 0;
  // console.log("image present",altPresence,altMeaningfullPercentage,imageCompressionScore);
}

const videoExistanceScore = checkVideoExistance($);

let embedding;
let lazyLoading;
let structuredMetadata;

if(videoExistanceScore==0){
  embedding=1;
  lazyLoading=1;
  structuredMetadata=1;
  // console.log("Video Embedding:", embedding);
  // console.log("Lazy Loading of Videos:", lazyLoading);
  // console.log("Structured Metadata for Videos:", structuredMetadata);
}
else{
  embedding= checkVideoEmbedding($)
  // console.log("Video Embedding:", embedding);
  lazyLoading= checkLazyLoading($)
  // console.log("Lazy Loading of Videos:", lazyLoading);
  structuredMetadata= checkStructuredMetadata($)
  // console.log("Structured Metadata for Videos:", structuredMetadata);
}

const headings = $("h1, h2, h3, h4, h5, h6")
  .map((i, el) => ({
    tag: el.tagName.toLowerCase(),
    text: $(el).text().trim()
  })).get();

let hierarchy;
if(h1Count==0 && h2Count==0 && h3Count==0 && h4Count==0 && h5Count==0 &&h6Count==0){
   hierarchy=1
  // console.log("hiere not found",hierarchy);
}
else{
    hierarchy= checkHierarchy(headings)
    // console.log("Heading Hierarchy Score:", hierarchy);
}

const keywords=["Canonical","Result","Audits"];
const alttextScore = altTextSEOScore($,keywords)?1:0;

const links = $("a").toArray();
const internal_and_discripitive_Link = await checkInternalLinks($,url,links);
const totalInternalLinks = internal_and_discripitive_Link.totalInternal;
const internalLinksDescriptiveScore = internal_and_discripitive_Link.descriptiveScore;

const semanticTagScoreResolved = await checkSemanticTags($);
const articleScore = semanticTagScoreResolved.article;
const sectionScore = semanticTagScoreResolved.section;
const headerScore = semanticTagScoreResolved.header;
const footerScore = semanticTagScoreResolved.footer;

// On-Page SEO (Structure & Uniqueness) 
const pageText = extractText($);
const dupScore = simpleDuplicateCheck(pageText);

const slug = getSlug(url);
let slugCheckScore = slugCheck(url);
let slugScore;
if(slugCheckScore == 0){
  slugScore = 1;
}
else{
  slugScore = slugValid(slug)
}

const checkHTTPSScore = checkHTTPS(url);

const paginationScore = checkPagination($);

const Total = parseFloat((((titleScore + titleExistanceScore + metaDescScore + metaDescExistanceScore + URLStructureScore + canonicalScore + canonicalExistanceScore + h1Score + altPresence + altMeaningfullPercentage + imageCompressionScore + embedding + lazyLoading + structuredMetadata + hierarchy + alttextScore + internalLinksDescriptiveScore + dupScore + slugScore + paginationScore) / 20) * 100).toFixed(0));

// Passed
const passed = [];

// Improvements
const improvements = [];

// On-Page SEO (Essentials) 
if (URLStructureScore === 0){
  improvements.push({
    metric: "URL Structure",
    current: "Long or complex URL",
    recommended: "≤ 5 segments, lowercase, hyphen-separated",
    severity: "Medium 🟡",
    suggestion: "Use clean, SEO-friendly URLs with hyphens instead of underscores or symbols."
  });
} else {
  passed.push({
    metric: "URL Structure",
    current: "Clean URL",
    recommended: "≤ 5 segments, lowercase, hyphen-separated",
    severity: "✅ Passed",
    suggestion: "URL structure is SEO-friendly."
  });
}

// On-Page SEO (Media & Semantics) 
if (h1Count === 0) {
  improvements.push({
    metric: "H1 Tag",
    current: "No H1 tag found",
    recommended: "Exactly 1 H1 per page",
    severity: "High 🔴",
    suggestion: "Add a single H1 tag to represent the main topic of the page."
  });
} else if (h1Count > 1) {
  improvements.push({
    metric: "H1 Tag",
    current: `${h1Count} H1 tags found`,
    recommended: "Exactly 1 H1 per page",
    severity: "Medium 🟡",
    suggestion: "Keep only one H1 tag and use H2–H6 for subheadings."
  });
} else {
  passed.push({
    metric: "H1 Tag",
    current: "1 H1 tag",
    recommended: "Exactly 1 H1 per page",
    severity: "✅ Passed",
    suggestion: "H1 tag is correctly implemented."
  });
}

if (imagePresenceScore === 0) {
  improvements.push({
    metric: "Images",
    current: "No images found",
    recommended: "At least one relevant image per page",
    severity: "Low 🟢",
    suggestion: "Add relevant images to improve engagement and SEO ranking."
  });
} else if (altPresence === 0 || altMeaningfullPercentage === 0 || imageCompressionScore === 0) {
  improvements.push({
    metric: "Image Alt Text",
    current: "Images have issues with alt text or size",
    recommended: "> 90% images should have descriptive alt text",
    severity: "Medium 🟡",
    suggestion: "Add descriptive, meaningful alt text for images to improve accessibility and SEO."
  });
} else {
  passed.push({
    metric: "Image Alt Text",
    current: "Images optimized with proper alt text",
    recommended: "> 90% images should have descriptive alt text",
    severity: "✅ Passed",
    suggestion: "Images and alt texts are optimized."
  });
}

if (videoExistanceScore === 0) {
  improvements.push({
    metric: "Video Content",
    current: "No embedded videos",
    recommended: "At least one video if applicable",
    severity: "Low 🟢",
    suggestion: "Embed relevant videos to improve engagement and SEO signals."
  });
} else if (embedding === 0 || lazyLoading === 0 || structuredMetadata === 0) {
  improvements.push({
    metric: "Video SEO",
    current: "Videos not fully optimized",
    recommended: "Proper embedding, lazy-loading, structured data",
    severity: "Medium 🟡",
    suggestion: "Ensure videos are embedded correctly, use lazy loading, and add JSON-LD metadata."
  });
} else {
  passed.push({
    metric: "Video SEO",
    current: "Videos optimized",
    recommended: "Proper embedding, lazy-loading, structured data",
    severity: "✅ Passed",
    suggestion: "Video SEO is implemented correctly."
  });
}

if (hierarchy === 0) {
  improvements.push({
    metric: "Heading Hierarchy",
    current: "Improper or skipped heading levels",
    recommended: "Logical H1 → H2 → H3 structure",
    severity: "Medium 🟡",
    suggestion: "Ensure headings follow a proper nested hierarchy for better crawlability."
  });
} else {
  passed.push({
    metric: "Heading Hierarchy",
    current: "Proper hierarchy",
    recommended: "Logical H1 → H2 → H3 structure",
    severity: "✅ Passed",
    suggestion: "Headings follow proper hierarchical structure."
  });
}

["article", "section", "header", "footer"].forEach(tag => {
  if (semanticTagScoreResolved[tag] === 0) {
    improvements.push({
      metric: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Tag`,
      current: "Missing",
      recommended: `Use <${tag}> for semantic structure`,
      severity: "Low 🟢",
      suggestion: `Add <${tag}> tag to improve semantic HTML and accessibility.`
    });
  } else {
    passed.push({
      metric: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Tag`,
      current: "Present",
      recommended: `Use <${tag}> for semantic structure`,
      severity: "✅ Passed",
      suggestion: `${tag} tag implemented correctly.`
    });
  }
});

// On-Page SEO (Structure & Uniqueness) 
if (dupScore === 0) {
  improvements.push({
    metric: "Duplicate Content",
    current: "Duplicate or thin content detected",
    recommended: "Unique content per page",
    severity: "High 🔴",
    suggestion: "Rewrite or merge duplicate pages and use canonical tags."
  });
} else {
  passed.push({
    metric: "Duplicate Content",
    current: "Unique content",
    recommended: "Unique content per page",
    severity: "✅ Passed",
    suggestion: "Content is unique."
  });
}

if (slugCheckScore === 0 || slugScore === 0) {
  improvements.push({
    metric: "Slug Structure",
    current: slug || "Missing or invalid slug",
    recommended: "Lowercase, hyphen-separated, ≤ 25 characters",
    severity: "Medium 🟡",
    suggestion: "Simplify slugs and include target keywords."
  });
} else {
  passed.push({
    metric: "Slug Structure",
    current: slug,
    recommended: "Lowercase, hyphen-separated, ≤ 25 characters",
    severity: "✅ Passed",
    suggestion: "Slug structure is correct."
  });
}

// Warning
const warning = [];

// On-Page SEO (Essentials) 
if (!title || titleExistanceScore === 0) {
  warning.push({
    metric: "Title Tag",
    current: "Missing",
    recommended: "30–60 characters, unique per page",
    severity: "High 🔴",
    suggestion: "Add a unique, keyword-rich title within 30–60 characters."
  });
} else {
  if (titleLength < 30) {
    warning.push({
      metric: "Title Tag",
      current: `Too short (${titleLength} characters)`,
      recommended: "30–60 characters, unique per page",
      severity: "High 🔴",
      suggestion: "Lengthen the title to at least 30 characters, include main keywords."
    });
  } else if (titleLength > 60) {
    warning.push({
      metric: "Title Tag",
      current: `Too long (${titleLength} characters)`,
      recommended: "30–60 characters, unique per page",
      severity: "High 🔴",
      suggestion: "Shorten the title to under 60 characters and keep it concise."
    });
  } else {
    passed.push({
      metric: "Title Tag",
      current: `${titleLength} characters`,
      recommended: "30–60 characters, unique per page",
      severity: "✅ Passed",
      suggestion: "Title length is optimal."
    });
  }
}

if (!metaDesc || metaDescExistanceScore === 0) {
  warning.push({
    metric: "Meta Description",
    current: "Missing",
    recommended: "≤ 160 characters, unique per page",
    severity: "High 🔴",
    suggestion: "Add a concise meta description including keywords."
  });
} else {
  if (metaDescLength < 50) {
    warning.push({
      metric: "Meta Description",
      current: `Too short (${metaDescLength} characters)`,
      recommended: "50–160 characters, unique per page",
      severity: "Medium 🟡",
      suggestion: "Lengthen the meta description to at least 50 characters."
    });
  } else if (metaDescLength > 165) {
    warning.push({
      metric: "Meta Description",
      current: `Too long (${metaDescLength} characters)`,
      recommended: "50–160 characters, unique per page",
      severity: "Medium 🟡",
      suggestion: "Shorten the meta description to under 165 characters."
    });
  } else {
    passed.push({
      metric: "Meta Description",
      current: `${metaDescLength} characters`,
      recommended: "50–160 characters, unique per page",
      severity: "✅ Passed",
      suggestion: "Meta description length is optimal."
    });
  }
}

if (!canonical || canonicalExistanceScore === 0) {
  warning.push({
    metric: "Canonical Tag",
    current: "Missing",
    recommended: "Self-referencing canonical tag",
    severity: "High 🔴",
    suggestion: "Add a canonical tag pointing to the same page."
  });
} else if (canonicalScore === 0) {
  warning.push({
    metric: "Canonical Tag",
    current: "Incorrect or not self-referencing",
    recommended: "Self-referencing canonical tag",
    severity: "High 🔴",
    suggestion: "Update canonical tag to match current URL."
  });
} else {
  passed.push({
    metric: "Canonical Tag",
    current: "Correct",
    recommended: "Self-referencing canonical tag",
    severity: "✅ Passed",
    suggestion: "Canonical tag is correct."
  });
}

// On-Page SEO (Media & Semantics) 
if (checkHTTPSScore === 0) {
  warning.push({
    metric: "HTTPS Implementation",
    current: "Not using HTTPS",
    recommended: "All pages should use HTTPS",
    severity: "High 🔴",
    suggestion: "Secure all pages using HTTPS and fix mixed-content issues."
  });
} else {
  passed.push({
    metric: "HTTPS Implementation",
    current: "HTTPS enabled",
    recommended: "All pages should use HTTPS",
    severity: "✅ Passed",
    suggestion: "HTTPS is correctly implemented."
  });
}

if (internalLinksDescriptiveScore === 0) {
  warning.push({
    metric: "Internal Links",
    current: `${internalLinksDescriptiveScore} descriptive`,
    recommended: "≥ 75% descriptive anchors",
    severity: "Medium 🟡",
    suggestion: "Use keyword-rich descriptive anchors for internal links."
  });
} else {
  passed.push({
    metric: "Internal Links",
    current: "≥ 75% descriptive",
    recommended: "≥ 75% descriptive anchors",
    severity: "✅ Passed",
    suggestion: "Internal links are descriptive."
  });
}

if (alttextScore === 0) {
  warning.push({
    metric: "ALT Text Relevance",
    current: "ALT text not descriptive enough or missing keywords",
    recommended: "Include relevant keywords in alt attributes",
    severity: "Medium 🟡",
    suggestion: "Ensure ALT attributes are meaningful and include target keywords."
  });
} else {
  passed.push({
    metric: "ALT Text Relevance",
    current: "Descriptive ALT text",
    recommended: "Include relevant keywords in alt attributes",
    severity: "✅ Passed",
    suggestion: "ALT text is descriptive and keyword-optimized."
  });
}

// On-Page SEO (Structure & Uniqueness) 
if (paginationScore === 0) {
  warning.push({
    metric: "Pagination",
    current: "Pagination schema or links missing",
    recommended: "Use rel=next/prev or logical pagination links",
    severity: "Low 🟢",
    suggestion: "Add pagination links or structured markup for multi-page content."
  });
} else {
  passed.push({
    metric: "Pagination",
    current: "Pagination present",
    recommended: "Use rel=next/prev or logical pagination links",
    severity: "✅ Passed",
    suggestion: "Pagination is implemented correctly."
  });
}

const actualPercentage = parseFloat((((paginationScore+titleExistanceScore+metaDescExistanceScore+internalLinksDescriptiveScore+canonicalExistanceScore+canonicalScore+alttextScore+checkHTTPSScore)/8)*100).toFixed(0))

// console.log(essentials);
// console.log(mediaAndSemantics);
// console.log(structureAndUniqueness);
// console.log(actualPercentage);
// console.log(warning);
// console.log(passed);
// console.log(Total);
// console.log(improvements);

  await SiteReport.findByIdAndUpdate(auditId, {
      On_Page_SEO: {
        Title: {
          Title: title,
          Title_Exist : titleExistanceScore,
          Title_Length: titleLength,
          Score: titleScore,
          Parameter:'1 if title exists and 30–60 characters, else 0'
        },
        Meta_Description: {
          MetaDescription: metaDesc,
          MetaDescription_Exist: metaDescExistanceScore,
          MetaDescription_Length: metaDescLength,
          Score: metaDescScore,
          Parameter:'1 if meta description exists and ≤ 165 characters, else 0'
        },
        URL_Structure: {
          Score: URLStructureScore,
          Parameter:'1 if URL ≤ 5 segments, lowercase, hyphen-separated, else 0'
        },
        Canonical: {
          Canonical: canonical,
          Canonical_Exist: canonicalExistanceScore,
          Score: canonicalScore,
          Parameter:'1 if canonical tag exists and matches page URL, else 0'
        },
        H1: {
          H1_Count: h1Count,
          H1_Count_Score: h1CountScore,
          Score: h1Score,
          Parameter:'1 if exactly one H1, 2 if >1, 0 if none'
        },
        Image:{
          Image_Exist: imagePresenceScore,
          Image_Alt_Exist: altPresence,
          Image_Alt_Meaningfull_Exist: altMeaningfullPercentage,
          Image_Compression_Exist: imageCompressionScore,
          Parameter:'Alt text ≥ 75% meaningful, images ≤ 200KB'
        },
        Video:{
          Video_Exist: videoExistanceScore,
          Video_Embedding_Exist: embedding,
          Video_LazyLoading_Exist: lazyLoading,
          Video_Structured_Metadata_Exist: structuredMetadata,
          Parameter:'Proper embedding, lazy-loading, JSON-LD metadata'
        },
        Heading_Hierarchy:{
          H1_Count: h1Count,
          H2_Count: h2Count,
          H3_Count: h3Count,
          H4_Count: h4Count,
          H5_Count: h5Count,
          H6_Count: h6Count,
          Heading: headings,
          Score:hierarchy,
          Parameter:'1 if headings follow proper H1→H2→H3 order, else 0',
        },
        ALT_Text_Relevance: {
          Score: alttextScore,
          Parameter: "1 if alt text contains keywords or is descriptive, else 0"
        },
        Internal_Links: {
          Total: totalInternalLinks,
          Descriptive_Score: internalLinksDescriptiveScore,
          Parameter: "1 if ≥ 75% internal links are descriptive, else 0"
        },
        Semantic_Tags: {
          Article_Score: articleScore,
          Section_Score: sectionScore,
          Header_Score: headerScore,
          Footer_Score: footerScore,
          Parameter: "1 if tag exists, else 0"
        },
        Duplicate_Content:{
          Score: dupScore,
          Parameter:'1 if duplication ≤ 75%, else 0'
        },
         URL_Slugs:{
          Slug:slug,
          Slug_Check_Score:slugCheckScore,
          Score:slugScore,
          Parameter:'1 if slug exists, ≤25 characters, lowercase hyphenated, else 0'
        },
        HTTPS: {
          Score: checkHTTPSScore,
          Parameter: "1 if HTTPS implemented, else 0"
        },
        Pagination_Tags:{
          Score: paginationScore,
          Parameter:'1 if pagination links or rel=next/prev exist, else 0'
        },
      Percentage: actualPercentage,
      Warning: warning,
      Passed: passed,
      Total: Total,
      Improvements: improvements
    },
    $set: {
          'Raw.Site': url,
          'Raw.Report': selectedMetric,
          'Raw.Device': device,
          'Raw.On_Page_SEO':{
        Title: {
          Title: title,
          Title_Exist : titleExistanceScore,
          Title_Length: titleLength,
          Score: titleScore,
          Parameter:'1 if title exists and 30–60 characters, else 0'
        },
        Meta_Description: {
          MetaDescription: metaDesc,
          MetaDescription_Exist: metaDescExistanceScore,
          MetaDescription_Length: metaDescLength,
          Score: metaDescScore,
          Parameter:'1 if meta description exists and ≤ 165 characters, else 0'
        },
        URL_Structure: {
          Score: URLStructureScore,
          Parameter:'1 if URL ≤ 5 segments, lowercase, hyphen-separated, else 0'
        },
        Canonical: {
          Canonical: canonical,
          Canonical_Exist: canonicalExistanceScore,
          Score: canonicalScore,
          Parameter:'1 if canonical tag exists and matches page URL, else 0'
        },
        H1: {
          H1_Count: h1Count,
          H1_Count_Score: h1CountScore,
          Score: h1Score,
          Parameter:'1 if exactly one H1, 2 if >1, 0 if none'
        },
        Image:{
          Image_Exist: imagePresenceScore,
          Image_Alt_Exist: altPresence,
          Image_Alt_Meaningfull_Exist: altMeaningfullPercentage,
          Image_Compression_Exist: imageCompressionScore,
          Parameter:'Alt text ≥ 75% meaningful, images ≤ 200KB'
        },
        Video:{
          Video_Exist: videoExistanceScore,
          Video_Embedding_Exist: embedding,
          Video_LazyLoading_Exist: lazyLoading,
          Video_Structured_Metadata_Exist: structuredMetadata,
          Parameter:'Proper embedding, lazy-loading, JSON-LD metadata'
        },
        Heading_Hierarchy:{
          H1_Count: h1Count,
          H2_Count: h2Count,
          H3_Count: h3Count,
          H4_Count: h4Count,
          H5_Count: h5Count,
          H6_Count: h6Count,
          Heading: headings,
          Score:hierarchy,
          Parameter:'1 if headings follow proper H1→H2→H3 order, else 0',
        },
        ALT_Text_Relevance: {
          Score: alttextScore,
          Parameter: "1 if alt text contains keywords or is descriptive, else 0"
        },
        Internal_Links: {
          Total: totalInternalLinks,
          Descriptive_Score: internalLinksDescriptiveScore,
          Parameter: "1 if ≥ 75% internal links are descriptive, else 0"
        },
        Semantic_Tags: {
          Article_Score: articleScore,
          Section_Score: sectionScore,
          Header_Score: headerScore,
          Footer_Score: footerScore,
          Parameter: "1 if tag exists, else 0"
        },
        Duplicate_Content:{
          Score: dupScore,
          Parameter:'1 if duplication ≤ 75%, else 0'
        },
         URL_Slugs:{
          Slug:slug,
          Slug_Check_Score:slugCheckScore,
          Score:slugScore,
          Parameter:'1 if slug exists, ≤25 characters, lowercase hyphenated, else 0'
        },
        HTTPS: {
          Score: checkHTTPSScore,
          Parameter: "1 if HTTPS implemented, else 0"
        },
        Pagination_Tags:{
          Score: paginationScore,
          Parameter:'1 if pagination links or rel=next/prev exist, else 0'
        },
      Percentage: actualPercentage
          }
        }
    });

    return actualPercentage
}