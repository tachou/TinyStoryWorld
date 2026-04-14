'use client';

import { useState, useEffect } from 'react';

interface ModerationItem {
  id: string;
  contentType: 'battle' | 'ai';
  studentId: string;
  title: string;
  language: string;
  readingStage: string;
  reviewStatus: string;
  createdAt: string;
  preview: string;
  authorName: string | null;
  matchup?: any;
  theme?: string;
}

interface ModerationStats {
  battlePending: number;
  aiPending: number;
  totalPending: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'battle' | 'ai'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/moderation?type=${filter}&status=${statusFilter}`
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch moderation items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filter, statusFilter]);

  const handleAction = async (item: ModerationItem, action: 'approve' | 'reject') => {
    setActing(item.id);
    try {
      const res = await fetch('/api/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          contentType: item.contentType,
          action,
        }),
      });
      if (res.ok) {
        // Remove from list
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        // Update stats
        if (stats) {
          const decrement = item.contentType === 'battle' ? 'battlePending' : 'aiPending';
          setStats({
            ...stats,
            [decrement]: stats[decrement] - 1,
            totalPending: stats.totalPending - 1,
          });
        }
      }
    } catch (err) {
      console.error('Moderation action failed:', err);
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold ">
            {'\u{1F6E1}\uFE0F'} Content Moderation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review student-generated content before it's shared.
          </p>
        </div>
        {stats && stats.totalPending > 0 && (
          <div className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-xl text-sm font-bold">
            {stats.totalPending} pending review
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {(['all', 'battle', 'ai'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'All Content' : t === 'battle' ? '\u2694\uFE0F Battle Stories' : '\u2728 AI Stories'}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-700">{stats.totalPending}</p>
            <p className="text-xs text-yellow-600">Total Pending</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-purple-700">{stats.battlePending}</p>
            <p className="text-xs text-purple-600">Battle Stories</p>
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-primary-700">{stats.aiPending}</p>
            <p className="text-xs text-primary-600">AI Stories</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">{statusFilter === 'pending' ? '\u2705' : '\u{1F4ED}'}</p>
          <p className="text-gray-600 font-medium">
            {statusFilter === 'pending'
              ? 'All caught up! No content pending review.'
              : `No ${statusFilter} content found.`}
          </p>
        </div>
      )}

      {/* Items list */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.contentType}-${item.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Item header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">
                        {item.contentType === 'battle' ? '\u2694\uFE0F' : '\u2728'}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          STATUS_STYLES[item.reviewStatus] || STATUS_STYLES.pending
                        }`}
                      >
                        {item.reviewStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>by {item.authorName || 'Unknown'}</span>
                      <span>{item.language.toUpperCase()}</span>
                      <span className="capitalize">{item.readingStage.replace('_', ' ')}</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {statusFilter === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(item, 'approve')}
                        disabled={acting === item.id}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {acting === item.id ? '...' : '\u2713 Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(item, 'reject')}
                        disabled={acting === item.id}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {acting === item.id ? '...' : '\u2717 Reject'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div
                  className="mt-3 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === item.id ? null : item.id)
                  }
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {expandedId === item.id ? item.preview : item.preview.substring(0, 120) + '...'}
                  </p>
                  <span className="text-xs text-primary-500 font-medium mt-1 inline-block">
                    {expandedId === item.id ? 'Show less' : 'Show more'}
                  </span>
                </div>

                {/* Matchup for battle stories */}
                {item.contentType === 'battle' && item.matchup && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(item.matchup as Record<string, any>).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
