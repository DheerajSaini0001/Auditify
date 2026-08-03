import React from 'react';
import { Field, CounterInput, CounterTextArea, TextInput, Toggle } from '../SeoUI.jsx';

/**
 * Title / description / canonical / robots — the fields that actually decide how
 * the page renders in search results. The recommended ranges match the scoring
 * service, so the counter turning green and the check passing are the same event.
 */
const GeneralTab = ({ draft, setSeo, darkMode }) => {
  const seo = draft.seo || {};

  return (
    <div className="space-y-5">
      <Field
        label="SEO title"
        darkMode={darkMode}
        hint={`Falls back to the page title (“${draft.title}”) when left empty.`}
      >
        <CounterInput
          darkMode={darkMode}
          value={seo.title || ''}
          onChange={(e) => setSeo('title', e.target.value)}
          placeholder={draft.title}
          recommended={[30, 60]}
          maxLength={70}
        />
      </Field>

      <Field
        label="Meta description"
        darkMode={darkMode}
        hint="Without one, Google writes its own snippet from the page body."
      >
        <CounterTextArea
          darkMode={darkMode}
          value={seo.description || ''}
          onChange={(e) => setSeo('description', e.target.value)}
          placeholder="A short, specific summary of what this page offers."
          recommended={[70, 160]}
          maxLength={200}
          rows={3}
        />
      </Field>

      <Field
        label="Canonical URL"
        darkMode={darkMode}
        hint="Point duplicate or parameterised URLs at the version you want ranked."
      >
        <TextInput
          darkMode={darkMode}
          value={seo.canonicalUrl || ''}
          onChange={(e) => setSeo('canonicalUrl', e.target.value)}
          placeholder="https://example.com/page"
          type="url"
        />
      </Field>

      <div className={`rounded-xl border p-4 space-y-3 ${darkMode ? 'border-slate-800 bg-white/[0.02]' : 'border-line bg-cardsoft'}`}>
        <div className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
          Robots
        </div>
        <div className="flex flex-wrap gap-6">
          <Toggle
            darkMode={darkMode}
            checked={!seo.noIndex}
            onChange={(v) => setSeo('noIndex', !v)}
            label="Allow indexing"
          />
          <Toggle
            darkMode={darkMode}
            checked={!seo.noFollow}
            onChange={(v) => setSeo('noFollow', !v)}
            label="Follow links"
          />
        </div>
        {seo.noIndex && (
          <p className="text-[11px] text-amber-600 font-medium">
            This page is set to noindex — search engines are told to keep it out of results entirely.
          </p>
        )}
      </div>
    </div>
  );
};

export default GeneralTab;
