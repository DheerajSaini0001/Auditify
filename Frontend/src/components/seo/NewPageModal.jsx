import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Card, Button, Field, TextInput } from './SeoUI.jsx';

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

const NewPageModal = ({ onClose, onCreate, darkMode }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);

  // The slug mirrors the title until the user edits it, after which it is theirs.
  const [slugTouched, setSlugTouched] = useState(false);
  const effectiveSlug = slugTouched ? slug : slugify(title);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    const ok = await onCreate({ title: title.trim(), slug: effectiveSlug });
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card darkMode={darkMode} className="w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-ink'}`}>New page</h2>
            <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
              Creates a draft page you can then optimise.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={darkMode ? 'text-slate-500 hover:text-white' : 'text-muted hover:text-ink'}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Page title" darkMode={darkMode}>
            <TextInput
              darkMode={darkMode}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="About us"
              autoFocus
              required
            />
          </Field>

          <Field label="Slug" darkMode={darkMode} hint="Used as the page path. Lowercase, hyphenated.">
            <TextInput
              darkMode={darkMode}
              value={effectiveSlug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
              placeholder="about-us"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" darkMode={darkMode} onClick={onClose}>Cancel</Button>
            <Button type="submit" darkMode={darkMode} disabled={!title.trim() || busy}>
              {busy ? 'Creating…' : 'Create page'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewPageModal;
