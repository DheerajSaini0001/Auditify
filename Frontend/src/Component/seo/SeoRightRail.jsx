import React from 'react';
import { Check, X, Save, RotateCcw } from 'lucide-react';
import { Card, Button } from './SeoUI.jsx';
import ScoreRing from './ScoreRing.jsx';

/**
 * Live score + the checklist that produced it, and the save controls.
 *
 * The checklist is the point: a bare number tells an editor nothing about what to
 * do next, so every failed check is a specific, actionable line. Failures sort to
 * the top for the same reason.
 */
const SeoRightRail = ({ live, dirty, saving, onSave, onRevert, darkMode }) => {
  const checks = [...(live.checks || [])].sort((a, b) => Number(a.passed) - Number(b.passed));
  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <div className="space-y-4">
      <Card darkMode={darkMode} className="p-5 flex flex-col items-center gap-3">
        <ScoreRing score={live.score} darkMode={darkMode} size={96} label="SEO score" />
        <p className={`text-xs text-center ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
          {passedCount} of {checks.length} checks passing
          {dirty && <span className="block mt-0.5 text-amber-600 font-semibold">Unsaved changes</span>}
        </p>
        <div className="flex flex-col gap-2 w-full">
          <Button darkMode={darkMode} onClick={onSave} disabled={!dirty || saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {dirty && (
            <Button variant="subtle" darkMode={darkMode} onClick={onRevert} disabled={saving}>
              <RotateCcw size={14} /> Discard
            </Button>
          )}
        </div>
      </Card>

      <Card darkMode={darkMode} className="overflow-hidden">
        <div className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide border-b ${
          darkMode ? 'text-slate-400 border-slate-800' : 'text-muted border-line'
        }`}>
          Checklist
        </div>
        <ul>
          {checks.map((c) => (
            <li
              key={c.id}
              className={`flex items-start gap-2.5 px-4 py-2.5 border-b last:border-b-0 ${
                darkMode ? 'border-slate-800/70' : 'border-line/70'
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  c.passed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/10 text-rose-500'
                }`}
              >
                {c.passed ? <Check size={10} strokeWidth={3.5} /> : <X size={10} strokeWidth={3.5} />}
              </span>
              <span className="min-w-0">
                <span className={`block text-[12.5px] leading-snug ${
                  c.passed
                    ? darkMode ? 'text-slate-400' : 'text-muted'
                    : darkMode ? 'text-slate-200 font-medium' : 'text-ink font-medium'
                }`}>
                  {c.label}
                </span>
                {!c.passed && c.hint && (
                  <span className={`block text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-faint'}`}>{c.hint}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default SeoRightRail;
