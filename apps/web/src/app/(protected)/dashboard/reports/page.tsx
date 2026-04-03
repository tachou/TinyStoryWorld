'use client';

import { useState, useEffect, useMemo } from 'react';

interface ClassOption {
  id: string;
  name: string;
  academicYear: string;
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  readingStage: string;
  currentLevel: number;
  totalBooksRead: number;
  totalStars: number;
  staminaBand: string;
  reading: {
    totalSessions: number;
    totalMinutes: number;
    totalPages: number;
    uniqueBooks: number;
    lastSessionAt: string | null;
  };
  battle: { totalStories: number };
  aiStories: { totalStories: number };
  silly: { totalRounds: number; totalCorrect: number; bestStreak: number };
}

interface ClassProgress {
  className: string;
  period: string;
  classStats: {
    totalStudents: number;
    activeStudents: number;
    totalReadingSessions: number;
    totalReadingMinutes: number;
    totalPages: number;
    totalBattleStories: number;
    totalAiStories: number;
    totalGrammarCorrect: number;
  };
  stageDistribution: Record<string, number>;
  dailyActivity: { day: string; sessions: number; minutes: number; activeStudents: number }[];
  students: StudentProgress[];
}

const STAGE_LABELS: Record<string, string> = {
  emergent: 'Emergent',
  beginner: 'Beginner',
  in_transition: 'In Transition',
  competent: 'Competent',
  experienced: 'Experienced',
};

const STAGE_COLORS: Record<string, string> = {
  emergent: 'bg-green-100 text-green-700',
  beginner: 'bg-blue-100 text-blue-700',
  in_transition: 'bg-yellow-100 text-yellow-700',
  competent: 'bg-purple-100 text-purple-700',
  experienced: 'bg-red-100 text-red-700',
};

const STAGE_BAR_COLORS: Record<string, string> = {
  emergent: 'bg-green-400',
  beginner: 'bg-blue-400',
  in_transition: 'bg-yellow-400',
  competent: 'bg-purple-400',
  experienced: 'bg-red-400',
};

function ClassOverview({ stats, stageDistribution, totalStudents }: {
  stats: ClassProgress['classStats'];
  stageDistribution: Record<string, number>;
  totalStudents: number;
}) {
  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox
          icon={'\u{1F464}'}
          label="Active Students"
          value={`${stats.activeStudents}/${stats.totalStudents}`}
          sub={`${stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}% engaged`}
          color="bg-indigo-50 border-indigo-200"
        />
        <StatBox
          icon={'\u{1F4D6}'}
          label="Total Pages Read"
          value={stats.totalPages}
          sub={`${stats.totalReadingSessions} sessions`}
          color="bg-blue-50 border-blue-200"
        />
        <StatBox
          icon={'\u23F1\uFE0F'}
          label="Reading Minutes"
          value={stats.totalReadingMinutes}
          sub={`${stats.totalStudents > 0 ? Math.round(stats.totalReadingMinutes / stats.totalStudents) : 0}m avg per student`}
          color="bg-green-50 border-green-200"
        />
        <StatBox
          icon={'\u270D\uFE0F'}
          label="Stories Created"
          value={stats.totalBattleStories + stats.totalAiStories}
          sub={`${stats.totalGrammarCorrect} grammar correct`}
          color="bg-amber-50 border-amber-200"
        />
      </div>

      {/* Stage Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          {'\u{1F4CA}'} Reading Stage Distribution
        </h3>
        <div className="space-y-2">
          {['emergent', 'beginner', 'in_transition', 'competent', 'experienced'].map((stage) => {
            const count = stageDistribution[stage] || 0;
            const pct = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-24">
                  {STAGE_LABELS[stage]}
                </span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STAGE_BAR_COLORS[stage]} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function ActivityChart({ data }: { data: ClassProgress['dailyActivity'] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center py-8">
        <p className="text-gray-400 text-sm">No activity data for this period.</p>
      </div>
    );
  }

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-3">
        {'\u{1F4C8}'} Daily Reading Activity
      </h3>
      <div className="flex items-end gap-1 h-32">
        {data.map((day) => {
          const height = Math.max((day.minutes / maxMinutes) * 100, 4);
          return (
            <div
              key={day.day}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${day.day}: ${day.minutes}m reading, ${day.sessions} sessions, ${day.activeStudents} students`}
            >
              <div className="w-full flex flex-col items-center justify-end h-24">
                <div
                  className="w-full max-w-[24px] bg-indigo-400 rounded-t-sm hover:bg-indigo-500 transition-colors cursor-help"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[8px] text-gray-400 rotate-[-45deg] w-10 text-center">
                {new Date(day.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>Older</span>
        <span>Recent</span>
      </div>
    </div>
  );
}

function StudentTable({
  students,
  sortKey,
  sortDir,
  onSort,
}: {
  students: StudentProgress[];
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}) {
  const SortHeader = ({ label, key: k }: { label: string; key: string }) => (
    <th
      className="text-left py-2.5 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
      onClick={() => onSort(k)}
    >
      {label}
      {sortKey === k && (
        <span className="ml-1">{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
      )}
    </th>
  );

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <SortHeader label="Student" key="name" />
              <SortHeader label="Stage" key="readingStage" />
              <SortHeader label="Pages" key="pages" />
              <SortHeader label="Minutes" key="minutes" />
              <SortHeader label="Books" key="books" />
              <SortHeader label="Stories" key="stories" />
              <SortHeader label="Grammar" key="grammar" />
              <SortHeader label="Last Active" key="lastActive" />
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const daysInactive = s.reading.lastSessionAt
                ? Math.floor(
                    (Date.now() - new Date(s.reading.lastSessionAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 999;
              const isInactive = daysInactive > 7;

              return (
                <tr
                  key={s.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isInactive ? 'bg-red-50/30' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.email}</p>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        STAGE_COLORS[s.readingStage] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STAGE_LABELS[s.readingStage] || s.readingStage}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-700">
                    {s.reading.totalPages}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {s.reading.totalMinutes}m
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {s.reading.uniqueBooks}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {s.battle.totalStories + s.aiStories.totalStories}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    {s.silly.totalCorrect}
                    {s.silly.bestStreak > 0 && (
                      <span className="text-[10px] text-amber-500 ml-1">
                        ({'\u{1F525}'}{s.silly.bestStreak})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-xs ${
                        isInactive ? 'text-red-500 font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {formatLastActive(s.reading.lastSessionAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [period, setPeriod] = useState('30d');
  const [progress, setProgress] = useState<ClassProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Fetch classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) setClasses(await res.json());
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    }
    fetchClasses();
  }, []);

  // Auto-select first class
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Fetch progress when class or period changes
  useEffect(() => {
    if (!selectedClassId) return;

    async function fetchProgress() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/classes/${selectedClassId}/progress?period=${period}`
        );
        if (res.ok) setProgress(await res.json());
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, [selectedClassId, period]);

  // Sort students
  const sortedStudents = useMemo(() => {
    if (!progress) return [];
    const students = [...progress.students];

    const getValue = (s: StudentProgress): number | string => {
      switch (sortKey) {
        case 'name':
          return s.name;
        case 'readingStage':
          return ['emergent', 'beginner', 'in_transition', 'competent', 'experienced'].indexOf(
            s.readingStage
          );
        case 'pages':
          return s.reading.totalPages;
        case 'minutes':
          return s.reading.totalMinutes;
        case 'books':
          return s.reading.uniqueBooks;
        case 'stories':
          return s.battle.totalStories + s.aiStories.totalStories;
        case 'grammar':
          return s.silly.totalCorrect;
        case 'lastActive':
          return s.reading.lastSessionAt
            ? new Date(s.reading.lastSessionAt).getTime()
            : 0;
        default:
          return s.name;
      }
    };

    students.sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc'
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });

    return students;
  }, [progress, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {'\u{1F4C8}'} Progress Reports
        </h1>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white min-w-[200px]"
            disabled={loadingClasses}
          >
            {loadingClasses && <option>Loading...</option>}
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
          <div className="flex gap-1">
            {[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: 'all', label: 'All time' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  period === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* No class selected */}
      {!loading && !selectedClassId && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-3xl mb-2">{'\u{1F3EB}'}</p>
          <p className="text-gray-500">Select a class to view progress reports.</p>
        </div>
      )}

      {/* Progress Data */}
      {!loading && progress && (
        <div className="space-y-6">
          {/* Class header */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              {progress.className}
            </h2>
            <span className="text-xs text-gray-400">
              {progress.classStats.totalStudents} student{progress.classStats.totalStudents !== 1 ? 's' : ''}
            </span>
          </div>

          {progress.students.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-3xl mb-2">{'\u{1F468}\u200D\u{1F3EB}'}</p>
              <p className="text-gray-500">No students in this class yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                Add students from the Classes page to see their progress.
              </p>
            </div>
          ) : (
            <>
              {/* Overview Cards + Stage Distribution */}
              <ClassOverview
                stats={progress.classStats}
                stageDistribution={progress.stageDistribution}
                totalStudents={progress.classStats.totalStudents}
              />

              {/* Activity Chart */}
              <ActivityChart data={progress.dailyActivity} />

              {/* Student Table */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  {'\u{1F464}'} Individual Student Progress
                </h3>
                <StudentTable
                  students={sortedStudents}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              </div>

              {/* Inactive students warning */}
              {(() => {
                const inactive = progress.students.filter((s) => {
                  if (!s.reading.lastSessionAt) return true;
                  const days = Math.floor(
                    (Date.now() - new Date(s.reading.lastSessionAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return days > 7;
                });
                if (inactive.length === 0) return null;
                return (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-red-700 mb-1">
                      {'\u26A0\uFE0F'} Inactive Students ({inactive.length})
                    </h4>
                    <p className="text-xs text-red-600 mb-2">
                      These students haven't had a reading session in over 7 days:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inactive.map((s) => (
                        <span
                          key={s.id}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
