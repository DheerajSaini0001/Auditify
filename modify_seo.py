import re

with open('/Users/dheeraj/Desktop/Auditify/Backend/metricServices/seoMetrics.js', 'r') as f:
    content = f.read()

# 1. H1 Tag
content = content.replace('''  if (h1Count === 0) {
    score = 0;''', '''  if (h1Count === 0) {
    score = 0.5;''')

content = content.replace('''  } else if (h1Count === 1) {
    score = 1;
    details = "Exactly one H1 tag found";''', '''  } else if (h1Count === 1) {
    if (content[0].length === 0) {
      score = 0.5;
      details = "H1 tag empty";
      explanation = "The <h1> tag exists but contains no text.";
      recommendation = "Add descriptive text to your <h1> tag.";
    } else {
      score = 1;
      details = "Exactly one H1 tag found";''')

# Close the new if else
content = content.replace('''    recommendation = "Ensure the H1 text contains your primary keyword and is compelling to users.";
  } else {
    score = 0.5;''', '''    recommendation = "Ensure the H1 text contains your primary keyword and is compelling to users.";
    }
  } else {
    score = 0.5;''')

# 2. Content Quality
content = content.replace('''  // 1. Thin Content Check
  if (wordCount < 300) {
    return evaluateParameter(0, "Thin content (<300 words)", { wordCount, repeatedSentences: [] });
  }''', '''  // 1. Thin Content Check
  if (wordCount < 100) {
    return evaluateParameter(0, "No / very low content (<100 words)", { wordCount, repeatedSentences: [] });
  } else if (wordCount < 300) {
    return evaluateParameter(0.5, "Less content (100-300 words)", { wordCount, repeatedSentences: [] });
  }''')

content = content.replace('''  if (repetitionRatio > 0.10) {
    return evaluateParameter(0.5, "High sentence repetition detected", { wordCount, repeatedSentences });
  }

  return evaluateParameter(1, "Content is unique and sufficient", { wordCount, repeatedSentences });''', '''  if (repetitionRatio > 0.10) {
    if (wordCount >= 1500) {
       return evaluateParameter(0.5, "Very long content but poor readability", { wordCount, repeatedSentences });
    }
    return evaluateParameter(0.5, "High sentence repetition detected", { wordCount, repeatedSentences });
  }

  return evaluateParameter(1, wordCount >= 1500 ? "Very long, structured content" : "Proper content", { wordCount, repeatedSentences });''')

# 3. Contextual links
content = content.replace('''    if (totalContentLinks === 0) {
      score = 0;
      issues.push("No contextual links found in main content area.");
    }''', '''    if (totalContentLinks === 0) {
      score = 0.5;
      issues.push("No contextual links found in main content area.");
    } else if (totalContentLinks > 100) {
      score = 0.5;
      issues.push("Too many contextual links (may look spammy).");
    }''')

content = content.replace('''    if (score === 1 && missingLinks.length > 5) { // Increased threshold slightly to be less sensitive
      score = 0.8;
    }''', '''    if (score === 1 && missingLinks.length > 5) { // Increased threshold slightly to be less sensitive
      score = 0.5; // Irrelevant links Warning
    }''')

content = content.replace('''    const details = score === 1 ? "Good contextual linking" : score === 0.8 ? "Optimization Opportunity" : "No contextual links found";''', '''    const details = score === 1 ? "Good contextual linking" : "Contextual linking issues found";''')

# 4. Canonical tag
content = content.replace('''  if (!exists) {
    score = 0;
    explanation = "No canonical tag was found in the <head> section of the page.";''', '''  if (!exists) {
    score = 0.5; // WARNING
    explanation = "No canonical tag was found in the <head> section of the page.";''')

content = content.replace('''          score = 0.5;
          details = "Canonical points to external domain";''', '''          score = 0; // ERROR
          details = "Canonical points to external domain";''')


with open('/Users/dheeraj/Desktop/Auditify/Backend/metricServices/seoMetrics.js', 'w') as f:
    f.write(content)

