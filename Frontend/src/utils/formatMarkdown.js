// Defensive final pass. All user/AI text is HTML-escaped up front, so the only markup
// in the output is the fixed, safe set of tags this function generates. This strips any
// dangerous constructs that could slip through (event handlers, javascript:, script/iframe)
// as a belt-and-suspenders guard, since the result is fed to dangerouslySetInnerHTML.
function sanitizeHtml(html) {
  return html
    .replace(/<\s*\/?\s*(script|iframe|object|embed|link|meta|style|svg)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export function formatMarkdown(text) {
  if (!text) return '';

  // Escape raw HTML angle brackets so they display as literal text inside the chat bubbles
  let escaped = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Normalize inline "Problem: ... Solution: ..." to separate lines
  let formatted = escaped.replace(/(Problem:[\s\S]*?)(Solution:)/gi, '$1\n\n$2');
  
  // Replace standard Markdown elements
  formatted = formatted
    .replace(/## (.+)/g, '<h3 class="ai-section-title">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="ai-code">$1</code>')
    .replace(/```([\s\S]+?)```/g, '<pre class="ai-pre"><code>$1</code></pre>')
    .replace(/^(\d+\.) (.+)/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');

  // Split by line and process Problem/Solution blocks
  const lines = formatted.split('\n');
  const renderedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    if (/^Problem:/i.test(trimmed)) {
      const content = trimmed.replace(/^Problem:/i, '').trim();
      return `<div class="ai-problem-block"><strong class="ai-highlight-key">Problem:</strong> ${content}</div>`;
    }
    
    if (/^Solution:/i.test(trimmed)) {
      const content = trimmed.replace(/^Solution:/i, '').trim();
      return `<div class="ai-solution-block"><strong class="ai-highlight-key">Solution:</strong> ${content}</div>`;
    }
    
    return trimmed.startsWith('<') ? trimmed : `<p>${trimmed}</p>`;
  });
  
  return sanitizeHtml(renderedLines.filter(Boolean).join(''));
}
