'use client';

import { useState, useEffect, useCallback } from 'react';

interface VoteCounts {
  funniest: number;
  smartest: number;
  surprising: number;
  best_plan: number;
}

const VOTE_CATEGORIES: {
  key: keyof VoteCounts;
  emoji: string;
  label: string;
  color: string;
  activeColor: string;
}[] = [
  { key: 'funniest', emoji: '\u{1F923}', label: 'Funniest', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', activeColor: 'bg-yellow-200 border-yellow-400 text-yellow-800 ring-2 ring-yellow-300' },
  { key: 'smartest', emoji: '\u{1F9E0}', label: 'Smartest', color: 'bg-blue-50 border-blue-200 text-blue-700', activeColor: 'bg-blue-200 border-blue-400 text-blue-800 ring-2 ring-blue-300' },
  { key: 'surprising', emoji: '\u{1F92F}', label: 'Surprising', color: 'bg-purple-50 border-purple-200 text-purple-700', activeColor: 'bg-purple-200 border-purple-400 text-purple-800 ring-2 ring-purple-300' },
  { key: 'best_plan', emoji: '\u{1F3AF}', label: 'Best Plan', color: 'bg-green-50 border-green-200 text-green-700', activeColor: 'bg-green-200 border-green-400 text-green-800 ring-2 ring-green-300' },
];

interface VotingPanelProps {
  storyId: string;
}

export function VotingPanel({ storyId }: VotingPanelProps) {
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({
    funniest: 0,
    smartest: 0,
    surprising: 0,
    best_plan: 0,
  });
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVotes() {
      try {
        const res = await fetch(`/api/battle-stories/${storyId}/votes`);
        if (res.ok) {
          const data = await res.json();
          setVoteCounts(data.voteCounts);
          setUserVotes(data.userVotes);
        }
      } catch (err) {
        console.error('Failed to fetch votes:', err);
      }
    }
    fetchVotes();
  }, [storyId]);

  const handleVote = useCallback(
    async (category: string) => {
      if (voting) return;
      setVoting(category);

      try {
        const res = await fetch(`/api/battle-stories/${storyId}/votes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.action === 'added') {
            setUserVotes((prev) => [...prev, category]);
            setVoteCounts((prev) => ({
              ...prev,
              [category]: (prev[category as keyof VoteCounts] || 0) + 1,
            }));
          } else {
            setUserVotes((prev) => prev.filter((v) => v !== category));
            setVoteCounts((prev) => ({
              ...prev,
              [category]: Math.max((prev[category as keyof VoteCounts] || 1) - 1, 0),
            }));
          }
        }
      } catch (err) {
        console.error('Failed to vote:', err);
      } finally {
        setVoting(null);
      }
    },
    [storyId, voting]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        Rate this story
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VOTE_CATEGORIES.map((cat) => {
          const isActive = userVotes.includes(cat.key);
          const count = voteCounts[cat.key] || 0;

          return (
            <button
              key={cat.key}
              onClick={() => handleVote(cat.key)}
              disabled={voting !== null}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                isActive ? cat.activeColor : `${cat.color} hover:scale-105`
              } ${voting ? 'opacity-60' : ''}`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs font-semibold">{cat.label}</span>
              {count > 0 && (
                <span className="text-[10px] font-bold opacity-70">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
