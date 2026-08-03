import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Wand2 } from 'lucide-react';
import { Button } from '../SeoUI.jsx';

/** Starting points, so the common cases don't require writing JSON-LD from memory. */
const TEMPLATES = {
  Organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '',
    url: '',
    logo: '',
  },
  WebSite: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '',
    url: '',
  },
  FAQPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: '', acceptedAnswer: { '@type': 'Answer', text: '' } }],
  },
  LocalBusiness: {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: '',
    address: { '@type': 'PostalAddress', streetAddress: '', addressLocality: '', postalCode: '' },
    telephone: '',
  },
  BreadcrumbList: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: '', item: '' }],
  },
};

/**
 * Raw JSON-LD editing. The text is kept as local state rather than parsed on every
 * keystroke — parsing as you type makes the field impossible to edit, because any
 * half-finished object is invalid JSON. It commits to the draft only when it parses.
 */
const SchemaTab = ({ draft, setSeo, darkMode }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const sd = draft.seo?.structuredData;
    setText(sd ? JSON.stringify(sd, null, 2) : '');
    setError(null);
    // Re-seed only when switching pages, not on every draft mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft._id]);

  const commit = (next) => {
    setText(next);
    if (!next.trim()) {
      setError(null);
      setSeo('structuredData', null);
      return;
    }
    try {
      setSeo('structuredData', JSON.parse(next));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wide mr-1 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
          Insert template
        </span>
        {Object.keys(TEMPLATES).map((key) => (
          <Button
            key={key}
            variant="ghost"
            darkMode={darkMode}
            className="!px-2.5 !py-1 !text-[11px]"
            onClick={() => commit(JSON.stringify(TEMPLATES[key], null, 2))}
          >
            <Wand2 size={12} /> {key}
          </Button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => commit(e.target.value)}
        rows={16}
        spellCheck={false}
        placeholder='{ "@context": "https://schema.org", "@type": "WebSite" }'
        className={`w-full rounded-xl px-3.5 py-3 text-[13px] font-mono leading-relaxed outline-none border transition-colors resize-y ${
          darkMode
            ? 'bg-[#0B1120] border-slate-700 text-slate-100 placeholder:text-slate-600'
            : 'bg-cardsoft border-line text-ink placeholder:text-faint'
        } ${error ? 'border-rose-500 focus:border-rose-500' : 'focus:border-accent'} focus:ring-2 focus:ring-accent/20`}
      />

      {error ? (
        <p className="flex items-start gap-2 text-[12px] font-medium text-rose-500">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>Invalid JSON — not saved yet: {error}</span>
        </p>
      ) : text.trim() ? (
        <p className="flex items-center gap-2 text-[12px] font-medium text-emerald-600">
          <Check size={14} /> Valid JSON-LD.
        </p>
      ) : (
        <p className={`text-[12px] ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
          No structured data on this page. Pick a template above to start.
        </p>
      )}
    </div>
  );
};

export default SchemaTab;
