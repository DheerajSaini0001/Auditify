import React from 'react';
import { Globe } from 'lucide-react';

const truncate = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * What the page will actually look like where it matters. Both previews truncate at
 * the same points the real surfaces do, so an over-long title is visible as a cut-off
 * here rather than only as a failed check in the sidebar.
 */
const PreviewTab = ({ draft, darkMode }) => {
  const seo = draft.seo || {};
  const title = seo.title || draft.title || 'Untitled page';
  const description = seo.description || 'No meta description set — Google will generate a snippet from the page content.';
  const url = seo.canonicalUrl || `https://your-site.com${draft.path || `/${draft.slug}`}`;
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || seo.description || '';

  return (
    <div className="space-y-7">
      <section>
        <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
          Google result
        </h4>
        <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-800 bg-[#0B1120]' : 'border-line bg-white'}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${darkMode ? 'bg-slate-800' : 'bg-surface-2'}`}>
              <Globe size={12} className={darkMode ? 'text-slate-400' : 'text-muted'} />
            </span>
            <span className={`text-[12px] leading-tight ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
              {displayUrl.split('/')[0]}
              <span className="block text-[11px] opacity-70">{displayUrl}</span>
            </span>
          </div>
          <div className="text-[19px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer">
            {truncate(title, 60)}
          </div>
          <p className={`text-[13px] leading-relaxed mt-1 ${darkMode ? 'text-slate-400' : 'text-[#4d5156]'}`}>
            {truncate(description, 160)}
          </p>
        </div>
        {seo.noIndex && (
          <p className="mt-2 text-[11px] font-semibold text-amber-600">
            Note: this page is set to noindex, so it will not appear in results at all.
          </p>
        )}
      </section>

      <section>
        <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
          Social share card
        </h4>
        <div className={`rounded-xl border overflow-hidden max-w-md ${darkMode ? 'border-slate-800' : 'border-line'}`}>
          <div
            className={`h-40 flex items-center justify-center text-[11px] font-medium ${
              darkMode ? 'bg-slate-800/60 text-slate-500' : 'bg-surface-2 text-faint'
            }`}
          >
            {seo.ogImage ? 'Share image set' : 'No share image — link previews will show text only'}
          </div>
          <div className={`p-3.5 ${darkMode ? 'bg-[#0B1120]' : 'bg-white'}`}>
            <div className={`text-[11px] uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-faint'}`}>
              {displayUrl.split('/')[0]}
            </div>
            <div className={`text-[15px] font-semibold mt-0.5 ${darkMode ? 'text-slate-100' : 'text-ink'}`}>
              {truncate(ogTitle, 90)}
            </div>
            {ogDescription && (
              <p className={`text-[12.5px] mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                {truncate(ogDescription, 160)}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PreviewTab;
