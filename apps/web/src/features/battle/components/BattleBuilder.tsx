'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/stores/languageStore';
import { CurriculumBadge } from '@/components/CurriculumBadge';
import { FIGHTER_CATEGORIES, SETTINGS, TWISTS, NUMBER_OPTIONS } from '../data/fighters';
import { checkContentSafety } from '../lib/contentSafety';

interface Prefill {
  parentStoryId: string;
  fighterA: string;
  numberA: number;
  fighterB: string;
  numberB: number;
  setting: string;
  twist: string;
}

interface BattleBuilderProps {
  prefill?: Prefill;
}

const READING_STAGES = [
  { key: 'emergent', label: 'Emergent' },
  { key: 'beginner', label: 'Beginner' },
  { key: 'in_transition', label: 'In Transition' },
  { key: 'competent', label: 'Competent' },
  { key: 'experienced', label: 'Experienced' },
];

export function BattleBuilder({ prefill }: BattleBuilderProps) {
  const router = useRouter();
  const language = useLanguageStore((s) => s.language);
  const profileReadingStage = useLanguageStore((s) => s.profileReadingStage);
  const activeWords = useLanguageStore((s) => s.activeWords);

  const allFighters = useMemo(() => {
    return FIGHTER_CATEGORIES.flatMap((c) => c.fighters);
  }, []);

  // Determine if prefilled values are from the dropdown list or custom
  const prefillAIsCustom = prefill ? !allFighters.includes(prefill.fighterA) : false;
  const prefillBIsCustom = prefill ? !allFighters.includes(prefill.fighterB) : false;

  const [fighterA, setFighterA] = useState(prefill && !prefillAIsCustom ? prefill.fighterA : '');
  const [numberA, setNumberA] = useState(prefill?.numberA ?? 3);
  const [fighterB, setFighterB] = useState(prefill && !prefillBIsCustom ? prefill.fighterB : '');
  const [numberB, setNumberB] = useState(prefill?.numberB ?? 1);
  const [setting, setSetting] = useState(prefill?.setting || SETTINGS[0]);
  const [twist, setTwist] = useState(prefill?.twist || TWISTS[0]);
  const [customA, setCustomA] = useState(prefillAIsCustom ? prefill!.fighterA : '');
  const [customB, setCustomB] = useState(prefillBIsCustom ? prefill!.fighterB : '');
  const [useCustomA, setUseCustomA] = useState(prefillAIsCustom);
  const [useCustomB, setUseCustomB] = useState(prefillBIsCustom);
  const [readingStage, setReadingStage] = useState(profileReadingStage);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [safetyWarning, setSafetyWarning] = useState('');

  // Sync reading stage when profile loads
  useEffect(() => {
    setReadingStage(profileReadingStage);
  }, [profileReadingStage]);

  const actualFighterA = useCustomA ? customA : fighterA;
  const actualFighterB = useCustomB ? customB : fighterB;

  // Client-side content safety check on custom inputs
  useEffect(() => {
    if (useCustomA && customA) {
      const blocked = checkContentSafety(customA);
      if (blocked) {
        setSafetyWarning('Fighter A contains inappropriate content. Please choose different words.');
        return;
      }
    }
    if (useCustomB && customB) {
      const blocked = checkContentSafety(customB);
      if (blocked) {
        setSafetyWarning('Fighter B contains inappropriate content. Please choose different words.');
        return;
      }
    }
    setSafetyWarning('');
  }, [customA, customB, useCustomA, useCustomB]);

  const previewLine = useMemo(() => {
    const a = actualFighterA || '???';
    const b = actualFighterB || '???';
    return `${numberA} ${a} vs ${numberB} ${b} in ${setting}`;
  }, [actualFighterA, actualFighterB, numberA, numberB, setting]);

  const isValid = actualFighterA.trim().length > 0 && actualFighterB.trim().length > 0 && !safetyWarning;

  const handleGenerate = async () => {
    if (!isValid) return;
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/battle-stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchup: {
            fighterA: actualFighterA,
            numberA,
            fighterB: actualFighterB,
            numberB,
            setting,
            twist,
          },
          language,
          readingStage,
          parentStoryId: prefill?.parentStoryId || null,
          curriculumWords: activeWords.length > 0 ? activeWords.map(w => w.word) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to generate story');
        return;
      }

      const story = await res.json();
      router.push(`/battle-stories/${story.id}`);
    } catch {
      setError('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  };

  const handleRandomize = () => {
    const randFrom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setFighterA(randFrom(allFighters));
    setFighterB(randFrom(allFighters));
    setNumberA(randFrom(NUMBER_OPTIONS));
    setNumberB(randFrom(NUMBER_OPTIONS));
    setSetting(randFrom(SETTINGS));
    setTwist(randFrom(TWISTS));
    setUseCustomA(false);
    setUseCustomB(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Live Preview */}
      <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border-2 border-red-200 text-center">
        <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-1">
          {prefill ? 'Your Remix' : 'Your Battle'}
        </p>
        <p className="text-xl md:text-2xl font-bold text-gray-900">
          {'\u2694\uFE0F'} {previewLine}
        </p>
        {twist && (
          <p className="text-sm text-gray-500 mt-1 italic">
            Twist: {twist}
          </p>
        )}
      </div>

      <div className="space-y-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {/* Fighter A */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-red-600">Fighter A</legend>
          <div className="flex gap-3">
            <select
              value={numberA}
              onChange={(e) => setNumberA(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm"
            >
              {NUMBER_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {useCustomA ? (
              <input
                type="text"
                value={customA}
                onChange={(e) => setCustomA(e.target.value)}
                placeholder="Type your own..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                maxLength={40}
              />
            ) : (
              <select
                value={fighterA}
                onChange={(e) => setFighterA(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Pick a fighter...</option>
                {FIGHTER_CATEGORIES.map((cat) => (
                  <optgroup key={cat.name} label={`${cat.emoji} ${cat.name}`}>
                    {cat.fighters.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomA}
              onChange={(e) => setUseCustomA(e.target.checked)}
              className="rounded border-gray-300"
            />
            Use custom fighter name
          </label>
        </fieldset>

        {/* VS Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-2xl font-black text-red-500">VS</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Fighter B */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-blue-600">Fighter B</legend>
          <div className="flex gap-3">
            <select
              value={numberB}
              onChange={(e) => setNumberB(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm"
            >
              {NUMBER_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {useCustomB ? (
              <input
                type="text"
                value={customB}
                onChange={(e) => setCustomB(e.target.value)}
                placeholder="Type your own..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                maxLength={40}
              />
            ) : (
              <select
                value={fighterB}
                onChange={(e) => setFighterB(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Pick a fighter...</option>
                {FIGHTER_CATEGORIES.map((cat) => (
                  <optgroup key={cat.name} label={`${cat.emoji} ${cat.name}`}>
                    {cat.fighters.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomB}
              onChange={(e) => setUseCustomB(e.target.checked)}
              className="rounded border-gray-300"
            />
            Use custom fighter name
          </label>
        </fieldset>

        {/* Setting */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Setting</label>
          <select
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {SETTINGS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Twist */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Plot Twist</label>
          <select
            value={twist}
            onChange={(e) => setTwist(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {TWISTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Reading Level */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Reading Level</label>
          <select
            value={readingStage}
            onChange={(e) => setReadingStage(e.target.value as any)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {READING_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}{stage.key === profileReadingStage ? ' (your level)' : ''}
              </option>
            ))}
          </select>
        </div>

        {safetyWarning && (
          <p className="text-sm text-orange-600 bg-orange-50 rounded-lg p-3">
            {'\u26A0\uFE0F'} {safetyWarning}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRandomize}
            className="px-5 py-3 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {'\u{1F3B2}'} Randomize
          </button>
          <button
            onClick={handleGenerate}
            disabled={!isValid || generating}
            className="flex-1 px-5 py-3 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Generating Story...
              </span>
            ) : prefill ? (
              <>{'\u{1F504}'} Generate Your Remix!</>
            ) : (
              <>{'\u2694\uFE0F'} Generate Battle Story!</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
