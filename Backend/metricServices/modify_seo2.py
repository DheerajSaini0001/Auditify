import re

with open('/Users/dheeraj/Desktop/Auditify/Backend/metricServices/seoMetrics.js', 'r') as f:
    content = f.read()

# robots.txt
content = content.replace('''    const score = exists ? 1 : 0;
    const details = exists ? "Robots.txt is present" : "Robots.txt not found";''', '''    let score = 0;
    let details = "Robots.txt check";
    
    if (!exists) {
      score = 0.5; // WARNING
      details = "Robots.txt missing";
    } else if (!content || content.trim() === "") {
      score = 0.5; // WARNING
      details = "Robots.txt empty";
    } else if (content.includes("Disallow: /\\n") || content.includes("Disallow: /\\r\\n") || re.search(r"Disallow:\s*/\s*$", content, re.M)) {
      score = 0; // ERROR
      details = "Wrong config (site block)";
    } else {
      score = 1; // GOOD
      details = "Proper robots.txt";
    }''')

# sitemap.xml
content = content.replace('''    const score = exists ? 1 : 0;
    const details = exists ? "Sitemap present" : "Sitemap.xml not found";''', '''    let score = 0;
    let details = "Sitemap check";
    
    if (!exists) {
      score = 0.5; // WARNING
      details = "sitemap.xml missing";
    } else if (content && !content.includes("<lastmod>")) {
      score = 0.5; // WARNING
      details = "Sitemap outdated (no lastmod)";
    } else {
      score = 1; // GOOD
      details = "Proper sitemap";
    }''')

# URL Structure
content = content.replace('''    const score = Math.max(0, 1 - (issues.length * 0.2));
    const details = issues.length === 0 ? "URL structure matches best practices" : `${issues.length} issues found`;''', '''    const score = issues.length === 0 ? 1 : 0.5; // WARNING
    const details = issues.length === 0 ? "Clean SEO URL" : `Poor URL structure: ${issues.join(", ")}`;''')

# Semantic Tags
content = content.replace('''    if (finalScore === 1) {
      details = "Excellent Semantic Structure";
      explanation = "The page effectively uses all key HTML5 semantic elements (header, nav, main, footer, etc.).";
      recommendation = "Maintain this structure to ensure accessibility and clear document outlines.";
    } else if (finalScore >= 0.7) {
      details = "Good Semantic Structure";
      explanation = `Most core structure tags are present. Missing: ${missingTags.join(", ")}.`;

      if (potentialReplacements.length > 0) {
        recommendation = `We detected divs that might serve as semantic elements. Try converting <div class="${potentialReplacements[0]}"> to <${potentialReplacements[0]}>.`;
      } else {
        recommendation = `Consider adding the missing <${missingTags[0]}> tag to further define your content structure.`;
      }
    } else {
      details = "Weak Semantic Structure";''', '''    if (finalScore === 1) {
      details = "Proper semantic HTML";
      explanation = "The page effectively uses all key HTML5 semantic elements (header, nav, main, footer, etc.).";
      recommendation = "Maintain this structure to ensure accessibility and clear document outlines.";
    } else if (finalScore >= 0.7) {
      finalScore = 0.5; // WARNING
      details = "Partial use";
      explanation = `Most core structure tags are present. Missing: ${missingTags.join(", ")}.`;

      if (potentialReplacements.length > 0) {
        recommendation = `We detected divs that might serve as semantic elements. Try converting <div class="${potentialReplacements[0]}"> to <${potentialReplacements[0]}>.`;
      } else {
        recommendation = `Consider adding the missing <${missingTags[0]}> tag to further define your content structure.`;
      }
    } else {
      finalScore = coreCount === 0 ? 0 : 0.5; // ERROR if major tags missing, else WARNING
      details = coreCount === 0 ? "Wrong structure (major)" : "Semantic tags missing";''')

# Open Graph / Twitter Cards
content = content.replace('''  let ogScore = ogCount === ogRequired.length ? 1 : (ogCount > 0 ? 0.5 : 0);''', '''  let ogScore = ogCount === ogRequired.length ? 1 : 0.5; // WARNING for missing or incomplete''')
content = content.replace('''  let twScore = twCount === twRequired.length ? 1 : (twCount > 0 ? 0.5 : 0);''', '''  let twScore = twCount === twRequired.length ? 1 : 0.5; // WARNING for missing or incomplete''')

# Social Links
content = content.replace('''  const linkScore = uniqueLinks.length > 0 ? 1 : 0;''', '''  const linkScore = uniqueLinks.length > 0 ? 1 : 0.5; // WARNING''')

# Structured Data
content = content.replace('''    const score = result.hasData ? 1 : 0;''', '''    const score = result.hasData ? 1 : 0.5; // WARNING''')

# Heading hierarchy
content = content.replace('''    const score = issues.length > 0 ? Math.max(0.5, 1 - (issues.length * 0.2)) : 1;
    const details = issues.length > 0 ? "Heading hierarchy issues found" : "Heading hierarchy is logical";''', '''    let score = 1;
    if (counts.h1 > 1) score = 0.5; // WARNING
    if (counts.h1 === 0 && headings.length === 0) score = 0; // High Severity
    else if (issues.length > 0) score = 0.5; // WARNING
    const details = score === 1 ? "Proper hierarchy" : (score === 0 ? "No headings at all" : "Heading hierarchy issues found");''')

with open('/Users/dheeraj/Desktop/Auditify/Backend/metricServices/seoMetrics.js', 'w') as f:
    f.write(content)
