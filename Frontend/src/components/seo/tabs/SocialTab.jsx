import React from 'react';
import { Field, CounterInput, CounterTextArea, Select, Button } from '../SeoUI.jsx';

/**
 * Open Graph + Twitter. Both fall back to the SEO title/description when empty,
 * which is why the copy buttons exist — most pages want them identical, and typing
 * the same sentence twice is how they drift apart.
 */
const SocialTab = ({ draft, setSeo, darkMode }) => {
  const seo = draft.seo || {};

  return (
    <div className="space-y-5">
      <Field
        label="Open Graph title"
        darkMode={darkMode}
        hint="Shown when the page is shared on Facebook, LinkedIn, WhatsApp and Slack."
        right={
          seo.title && seo.title !== seo.ogTitle ? (
            <Button variant="subtle" darkMode={darkMode} className="!px-2 !py-0.5 !text-[11px]" onClick={() => setSeo('ogTitle', seo.title)}>
              Copy from SEO title
            </Button>
          ) : null
        }
      >
        <CounterInput
          darkMode={darkMode}
          value={seo.ogTitle || ''}
          onChange={(e) => setSeo('ogTitle', e.target.value)}
          placeholder={seo.title || draft.title}
          recommended={[30, 90]}
          maxLength={95}
        />
      </Field>

      <Field
        label="Open Graph description"
        darkMode={darkMode}
        right={
          seo.description && seo.description !== seo.ogDescription ? (
            <Button variant="subtle" darkMode={darkMode} className="!px-2 !py-0.5 !text-[11px]" onClick={() => setSeo('ogDescription', seo.description)}>
              Copy from meta description
            </Button>
          ) : null
        }
      >
        <CounterTextArea
          darkMode={darkMode}
          value={seo.ogDescription || ''}
          onChange={(e) => setSeo('ogDescription', e.target.value)}
          placeholder={seo.description}
          recommended={[70, 160]}
          maxLength={200}
          rows={3}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Open Graph type" darkMode={darkMode}>
          <Select darkMode={darkMode} value={seo.ogType || 'website'} onChange={(e) => setSeo('ogType', e.target.value)}>
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="product">product</option>
            <option value="profile">profile</option>
          </Select>
        </Field>

        <Field label="Twitter card" darkMode={darkMode}>
          <Select
            darkMode={darkMode}
            value={seo.twitterCard || 'summary_large_image'}
            onChange={(e) => setSeo('twitterCard', e.target.value)}
          >
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </Select>
        </Field>
      </div>

      <div className={`rounded-xl border p-4 ${darkMode ? 'border-slate-800 bg-white/[0.02]' : 'border-line bg-cardsoft'}`}>
        <div className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
          Share image
        </div>
        <p className={`text-[12px] leading-relaxed ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
          The share image is a reference to an item in the CMS media library, which isn't wired up yet — the
          media upload surface is a later phase. Until then this stays empty, and the
          “Open Graph title and image are set” check will not pass.
        </p>
      </div>
    </div>
  );
};

export default SocialTab;
