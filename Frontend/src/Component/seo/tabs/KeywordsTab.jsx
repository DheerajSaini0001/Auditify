import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Field, TagInput } from '../SeoUI.jsx';
import { derivePresence, focusKeywordOf } from '../../../utils/seoScore.js';

const PRESENCE_ROWS = [
  { key: 'title', label: 'In the SEO title', weight: 'Strong signal' },
  { key: 'description', label: 'In the meta description', weight: 'Affects click-through, not rank' },
  { key: 'slug', label: 'In the URL slug', weight: 'Strong signal' },
  { key: 'excerpt', label: 'In the excerpt', weight: 'Minor signal' },
];

/**
 * Keywords, plus where the focus keyword actually lands. Presence is computed from
 * the fields this dashboard owns — anything needing page body text would require a
 * crawl, so it is deliberately not claimed here.
 */
const KeywordsTab = ({ draft, setSeo, darkMode }) => {
  const seo = draft.seo || {};
  const focus = focusKeywordOf(seo);
  const presence = useMemo(() => derivePresence(draft), [draft]);

  return (
    <div className="space-y-5">
      <Field
        label="Keywords"
        darkMode={darkMode}
        hint="The first keyword is the focus keyword — it's the one scored against the title and slug."
      >
        <TagInput
          darkMode={darkMode}
          value={seo.keywords || []}
          onChange={(v) => setSeo('keywords', v)}
          placeholder="Add a keyword and press Enter"
        />
      </Field>

      {!focus ? (
        <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
          Add a keyword above to see where it appears across this page's SEO fields.
        </p>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-slate-800' : 'border-line'}`}>
          <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${darkMode ? 'bg-white/[0.03] text-slate-400' : 'bg-cardsoft text-muted'}`}>
            Focus keyword: <span className="text-accent normal-case tracking-normal">{focus}</span>
          </div>
          <ul>
            {PRESENCE_ROWS.map((row) => {
              const hit = presence[row.key];
              return (
                <li
                  key={row.key}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 border-t text-sm ${
                    darkMode ? 'border-slate-800' : 'border-line'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        hit ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {hit ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                    </span>
                    <span className={darkMode ? 'text-slate-300' : 'text-inksoft'}>{row.label}</span>
                  </span>
                  <span className={`text-[11px] ${darkMode ? 'text-slate-600' : 'text-faint'}`}>{row.weight}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default KeywordsTab;
