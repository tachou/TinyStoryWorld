'use client';

import { useState, useEffect, useCallback } from 'react';

interface ClassData {
  id: string;
  name: string;
  academicYear: string;
}

interface BookData {
  id: string;
  title: string;
  language: string;
  stage: string;
}

interface AssignmentData {
  id: string;
  type: string;
  assignedTo: string;
  dueDate: string | null;
  createdAt: string;
  classId: string | null;
  bookId: string | null;
  bookTitle: string | null;
  bookLanguage: string | null;
  bookStage: string | null;
  curriculumFilterEnabled: boolean;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  book: { label: 'Read Book', icon: '\u{1F4D6}', color: 'bg-primary-100 text-primary-700' },
  'silly-sentences': { label: 'Silly Sentences', icon: '\u{1F9E9}', color: 'bg-purple-100 text-purple-700' },
  'ai-story': { label: 'AI Story', icon: '\u2728', color: 'bg-yellow-100 text-yellow-700' },
  'battle-story': { label: 'Battle Story', icon: '\u2694\uFE0F', color: 'bg-red-100 text-red-700' },
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState('book');
  const [formClassId, setFormClassId] = useState('');
  const [formBookId, setFormBookId] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('class');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCurriculumFilter, setFormCurriculumFilter] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch('/api/assignments');
      if (res.ok) setAssignments(await res.json());
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0 && !formClassId) setFormClassId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  }, [formClassId]);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) setBooks(await res.json());
    } catch (err) {
      console.error('Failed to fetch books:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
    fetchBooks();
  }, [fetchAssignments, fetchClasses, fetchBooks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          classId: formClassId || null,
          bookId: formType === 'book' ? formBookId : null,
          assignedTo: formAssignedTo,
          dueDate: formDueDate || null,
          curriculumFilterEnabled: formCurriculumFilter,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormType('book');
        setFormBookId('');
        setFormDueDate('');
        setFormCurriculumFilter(false);
        fetchAssignments();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create assignment');
      }
    } catch {
      setFormError('Network error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold ">Assignments</h1>
          <p className="text-sm text-gray-500 mt-1">Assign books and activities to your classes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          + New Assignment
        </button>
      </div>

      {/* Create Assignment Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="book">Read a Book</option>
                  <option value="silly-sentences">Silly Sentences Session</option>
                  <option value="battle-story">Battle Story</option>
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                {classes.length === 0 ? (
                  <p className="text-sm text-orange-600">You need to create a class first.</p>
                ) : (
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.academicYear})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Book selector (only for book assignments) */}
              {formType === 'book' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
                  {books.length === 0 ? (
                    <p className="text-sm text-orange-600">No books available. Seed some books first.</p>
                  ) : (
                    <select
                      value={formBookId}
                      onChange={(e) => setFormBookId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Select a book...</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} ({book.language.toUpperCase()} - {book.stage})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Assign to */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={formAssignedTo}
                  onChange={(e) => setFormAssignedTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="class">Entire Class</option>
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Curriculum filter (for silly-sentences) */}
              {formType === 'silly-sentences' && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formCurriculumFilter}
                    onChange={(e) => setFormCurriculumFilter(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Restrict to curriculum word list
                </label>
              )}

              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setFormError(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classes.length === 0}
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">{'\u{1F4DD}'}</p>
          <p className="text-gray-500 text-lg">No assignments yet.</p>
          <p className="text-gray-400 text-sm mt-1">Create an assignment to get your students started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const typeInfo = TYPE_LABELS[a.type] || { label: a.type, icon: '\u{1F4CB}', color: 'bg-gray-100 text-gray-600' };
            const overdue = isOverdue(a.dueDate);
            const className = classes.find((c) => c.id === a.classId);

            return (
              <div
                key={a.id}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <span className="text-2xl">{typeInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    {a.bookTitle && (
                      <span className="text-sm font-medium text-gray-900 truncate">{a.bookTitle}</span>
                    )}
                    {a.curriculumFilterEnabled && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Curriculum
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {className && <span>{className.name}</span>}
                    <span>{'\u2022'}</span>
                    <span>Assigned to: {a.assignedTo}</span>
                    <span>{'\u2022'}</span>
                    <span className={overdue ? 'text-red-500 font-medium' : ''}>
                      {overdue ? 'Overdue: ' : 'Due: '}{formatDate(a.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
