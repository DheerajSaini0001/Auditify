import React, { useState } from 'react';
import { AlertCircle, Check, Plus, Trash2, Braces } from 'lucide-react';
import { Button, Select, Toggle, EmptyState } from '../SeoUI.jsx';

const SCHEMA_TYPES = [
  'Organization', 'WebSite', 'FAQPage', 'Article', 'Product',
  'BreadcrumbList', 'Review', 'VideoObject', 'Person', 'Event', 'LocalBusiness',
];

/** Sensible starting shapes, so a block doesn't have to be typed from memory. */
const TEMPLATES = {
  Organization: { '@context': 'https://schema.org', '@type': 'Organization', name: '', url: '', logo: '' },
  WebSite: { '@context': 'https://schema.org', '@type': 'WebSite', name: '', url: '' },
  FAQPage: {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: '', acceptedAnswer: { '@type': 'Answer', text: '' } }],
  },
  Article: { '@context': 'https://schema.org', '@type': 'Article', headline: '', author: { '@type': 'Person', name: '' }, datePublished: '' },
  Product: { '@context': 'https://schema.org', '@type': 'Product', name: '', description: '', offers: { '@type': 'Offer', price: '', priceCurrency: 'AUD' } },
  BreadcrumbList: {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: '', item: '' }],
  },
  Review: { '@context': 'https://schema.org', '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: '' }, author: { '@type': 'Person', name: '' } },
  VideoObject: { '@context': 'https://schema.org', '@type': 'VideoObject', name: '', description: '', thumbnailUrl: '', uploadDate: '' },
  Person: { '@context': 'https://schema.org', '@type': 'Person', name: '', jobTitle: '' },
  Event: { '@context': 'https://schema.org', '@type': 'Event', name: '', startDate: '', location: { '@type': 'Place', name: '' } },
  LocalBusiness: {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: '', telephone: '',
    address: { '@type': 'PostalAddress', streetAddress: '', addressLocality: '', postalCode: '' },
  },
};

/**
 * One editor per JSON-LD block. Text is held locally and only committed to the draft
 * when it parses — parsing on every keystroke makes the field impossible to edit,
 * because a half-typed object is never valid JSON.
 */
const BlockEditor = ({ block, index, onChange, onRemove, darkMode }) => {
  const [text, setText] = useState(() => JSON.stringify(block.jsonLd ?? {}, null, 2));
  const [error, setError] = useState(null);

  const commit = (next) => {
    setText(next);
    if (!next.trim()) { setError(null); onChange({ ...block, jsonLd: {} }); return; }
    try {
      onChange({ ...block, jsonLd: JSON.parse(next) });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const changeType = (type) => {
    const tpl = TEMPLATES[type] || { '@context': 'https://schema.org', '@type': type };
    setText(JSON.stringify(tpl, null, 2));
    setError(null);
    onChange({ ...block, type, jsonLd: tpl });
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-slate-800' : 'border-line'}`}>
      <div className={`flex flex-wrap items-center gap-3 px-3 py-2.5 border-b ${darkMode ? 'border-slate-800 bg-white/[0.02]' : 'border-line bg-cardsoft'}`}>
        <Select darkMode={darkMode} value={block.type} onChange={(e) => changeType(e.target.value)} className="!w-auto !py-1.5 !text-xs">
          {SCHEMA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Toggle
          darkMode={darkMode}
          checked={block.isActive !== false}
          onChange={(v) => onChange({ ...block, isActive: v })}
          label={block.isActive !== false ? 'Active' : 'Inactive'}
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${block.type} block`}
          className={`ml-auto ${darkMode ? 'text-slate-500 hover:text-rose-400' : 'text-muted hover:text-rose-500'}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => commit(e.target.value)}
        rows={10}
        spellCheck={false}
        aria-label={`${block.type} JSON-LD, block ${index + 1}`}
        className={`w-full px-3.5 py-3 text-[13px] font-mono leading-relaxed outline-none resize-y border-0 ${
          darkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-card text-ink'
        } ${error ? 'ring-1 ring-inset ring-rose-500' : ''}`}
      />

      <div className={`px-3.5 py-2 text-[11px] font-medium border-t ${darkMode ? 'border-slate-800' : 'border-line'}`}>
        {error ? (
          <span className="flex items-center gap-1.5 text-rose-500"><AlertCircle size={12} /> Invalid JSON — this block is not saved: {error}</span>
        ) : block.isActive === false ? (
          <span className={darkMode ? 'text-slate-500' : 'text-muted'}>Valid, but inactive — it will not be served.</span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-600"><Check size={12} /> Valid and active.</span>
        )}
      </div>
    </div>
  );
};

const SchemaTab = ({ draft, setSeo, darkMode }) => {
  const blocks = draft.seo?.schemas || [];

  const setBlocks = (next) => setSeo('schemas', next);
  const addBlock = () => setBlocks([...blocks, {
    type: 'Organization', jsonLd: TEMPLATES.Organization, isActive: true, generatedBy: 'manual',
  }]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[12px] ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
          Active blocks are served on the page as JSON-LD. A page commonly needs several.
        </p>
        <Button darkMode={darkMode} onClick={addBlock} className="shrink-0">
          <Plus size={15} /> Add block
        </Button>
      </div>

      {blocks.length === 0 ? (
        <EmptyState
          darkMode={darkMode}
          icon={Braces}
          title="No structured data"
          subtitle="Add a block to describe this page to search engines. Organization and WebSite are the usual sitewide pair."
          action={<Button darkMode={darkMode} onClick={addBlock}><Plus size={15} /> Add block</Button>}
        />
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <BlockEditor
              key={block._id || `block-${i}`}
              block={block}
              index={i}
              darkMode={darkMode}
              onChange={(next) => setBlocks(blocks.map((b, j) => (j === i ? next : b)))}
              onRemove={() => setBlocks(blocks.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SchemaTab;
