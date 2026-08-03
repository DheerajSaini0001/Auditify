import React from 'react';
import { Plus, X, ShieldAlert } from 'lucide-react';
import { Field, TextInput, Select, Button } from '../SeoUI.jsx';

/**
 * Language, alternates and redirects.
 *
 * The header/footer script fields are stored but deliberately never rendered — see
 * the note at the bottom of this file and the matching warning on the model.
 */
const AdvancedTab = ({ draft, setSeo, darkMode }) => {
  const adv = draft.seo?.advanced || {};
  const hreflang = adv.hreflang || [];
  const redirect = adv.pageRedirect || {};

  const patch = (partial) => setSeo('advanced', { ...adv, ...partial });
  const setHreflang = (rows) => patch({ hreflang: rows });

  return (
    <div className="space-y-5">
      <Field label="Page language" darkMode={darkMode} hint="BCP 47 tag, e.g. en, en-AU, hi-IN.">
        <TextInput
          darkMode={darkMode}
          value={adv.language || ''}
          onChange={(e) => patch({ language: e.target.value })}
          placeholder="en"
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
            Hreflang alternates
          </span>
          <Button
            variant="ghost"
            darkMode={darkMode}
            className="!px-2.5 !py-1 !text-[11px]"
            onClick={() => setHreflang([...hreflang, { lang: '', url: '' }])}
          >
            <Plus size={12} /> Add
          </Button>
        </div>

        {hreflang.length === 0 ? (
          <p className={`text-[12px] ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
            No alternates. Add one per language version of this page so search engines serve the right one.
          </p>
        ) : (
          <div className="space-y-2">
            {hreflang.map((row, i) => (
              <div key={`hreflang-${i}`} className="flex gap-2 items-start">
                <TextInput
                  darkMode={darkMode}
                  value={row.lang || ''}
                  placeholder="en-AU"
                  className="!w-28 shrink-0"
                  onChange={(e) => setHreflang(hreflang.map((r, j) => (j === i ? { ...r, lang: e.target.value } : r)))}
                />
                <TextInput
                  darkMode={darkMode}
                  value={row.url || ''}
                  placeholder="https://example.com/au/page"
                  onChange={(e) => setHreflang(hreflang.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
                />
                <button
                  type="button"
                  aria-label={`Remove alternate ${i + 1}`}
                  onClick={() => setHreflang(hreflang.filter((_, j) => j !== i))}
                  className={`mt-2.5 shrink-0 ${darkMode ? 'text-slate-500 hover:text-rose-400' : 'text-muted hover:text-rose-500'}`}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'border-slate-800 bg-white/[0.02]' : 'border-line bg-cardsoft'}`}>
        <div className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
          Redirect
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3">
          <Select
            darkMode={darkMode}
            value={redirect.type ?? ''}
            onChange={(e) => patch({
              pageRedirect: { ...redirect, type: e.target.value ? Number(e.target.value) : null },
            })}
          >
            <option value="">No redirect</option>
            <option value="301">301 permanent</option>
            <option value="302">302 temporary</option>
          </Select>
          <TextInput
            darkMode={darkMode}
            value={redirect.target || ''}
            disabled={!redirect.type}
            placeholder="/destination-path"
            onChange={(e) => patch({ pageRedirect: { ...redirect, target: e.target.value } })}
          />
        </div>
        {redirect.type === 301 && (
          <p className="text-[11px] font-medium text-amber-600">
            A 301 is treated as permanent and gets cached hard by browsers and search engines. Use 302 if you might undo it.
          </p>
        )}
      </div>

      <div className={`rounded-xl border p-4 ${darkMode ? 'border-amber-900/40 bg-amber-950/10' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Custom scripts</div>
            <p className={`text-[12px] leading-relaxed mt-1 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
              Header and footer script fields exist on the model but are intentionally not editable here and are
              never injected into a page. Rendering author-supplied script text is stored XSS, and the public
              metadata endpoint deliberately omits these fields. If you need third-party tags, add them to
              <code className="mx-1 px-1 rounded bg-black/10">index.html</code>
              where they go through review and the Content Security Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTab;
