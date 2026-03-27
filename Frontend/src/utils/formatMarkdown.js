export function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/## (.+)/g, '<h3 class="ai-section-title">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code class="ai-code">$1</code>')
    .replace(/```([\s\S]+?)```/g, '<pre class="ai-pre"><code>$1</code></pre>')
    .replace(/^(\d+\.) (.+)/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`);
}
