'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ClassData {
  id: string;
  name: string;
  academicYear: string;
  maxStudents: number;
  createdAt: string;
  students?: StudentData[];
}

interface StudentData {
  profileId: string;
  userId: string;
  displayName: string;
  email: string;
  readingStage: string;
  currentLevel: number;
  totalBooksRead: number;
  totalStars: number;
}

interface WordListOption {
  id: string;
  name: string;
  language: string;
  words: { word: string }[];
}

interface CurriculumConfig {
  id: string;
  studentId: string;
  language: string;
  wordlistIds: string[];
  filterEnabled: boolean;
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

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Create form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState('2025-2026');
  const [newClassMax, setNewClassMax] = useState(35);

  // Add student form state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentStage, setStudentStage] = useState('emergent');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Curriculum assignment state
  const [wordLists, setWordLists] = useState<WordListOption[]>([]);
  const [curriculumConfigs, setCurriculumConfigs] = useState<Record<string, CurriculumConfig[]>>({});
  const [curriculumLang, setCurriculumLang] = useState('en');
  const [savingCurriculum, setSavingCurriculum] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) setClasses(await res.json());
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentCurriculum = useCallback(async (studentUserId: string) => {
    try {
      const res = await fetch(`/api/students/${studentUserId}/curriculum`);
      if (res.ok) {
        const configs: CurriculumConfig[] = await res.json();
        setCurriculumConfigs((prev) => ({ ...prev, [studentUserId]: configs }));
      }
    } catch (err) {
      console.error('Failed to fetch curriculum for student:', err);
    }
  }, []);

  const fetchClassDetails = useCallback(async (classId: string) => {
    try {
      const res = await fetch(`/api/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClass(data);
        // Fetch curriculum configs for each student
        if (data.students) {
          for (const student of data.students) {
            fetchStudentCurriculum(student.userId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch class details:', err);
    }
  }, [fetchStudentCurriculum]);

  const fetchWordLists = useCallback(async () => {
    try {
      const res = await fetch('/api/word-lists');
      if (res.ok) setWordLists(await res.json());
    } catch (err) {
      console.error('Failed to fetch word lists:', err);
    }
  }, []);

  const handleAssignCurriculum = async (studentUserId: string, wordlistId: string | null, language: string) => {
    setSavingCurriculum(studentUserId);
    try {
      const res = await fetch(`/api/students/${studentUserId}/curriculum`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordlistId, language }),
      });
      if (res.ok) {
        await fetchStudentCurriculum(studentUserId);
      }
    } catch (err) {
      console.error('Failed to assign curriculum:', err);
    } finally {
      setSavingCurriculum(null);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchWordLists();
  }, [fetchClasses, fetchWordLists]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName,
          academicYear: newClassYear,
          maxStudents: newClassMax,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setNewClassName('');
        fetchClasses();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create class');
      }
    } catch {
      setFormError('Network error');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? All student profiles will be removed.')) return;

    try {
      const res = await fetch(`/api/classes/${classId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedClass(null);
        fetchClasses();
      }
    } catch (err) {
      console.error('Failed to delete class:', err);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setFormError('');
    setFormSuccess('');

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, readingStage: studentStage }),
      });

      if (res.ok) {
        setStudentEmail('');
        setFormSuccess('Student added!');
        fetchClassDetails(selectedClass.id);
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to add student');
      }
    } catch {
      setFormError('Network error');
    }
  };

  const handleRemoveStudent = async (profileId: string) => {
    if (!selectedClass) return;
    if (!confirm('Remove this student from the class?')) return;

    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentProfileId: profileId }),
      });

      if (res.ok) {
        fetchClassDetails(selectedClass.id);
      }
    } catch (err) {
      console.error('Failed to remove student:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your classes and students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + New Class
        </button>
      </div>

      {/* Create Class Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Grade 3 French"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={newClassYear}
                  onChange={(e) => setNewClassYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                <input
                  type="number"
                  value={newClassMax}
                  onChange={(e) => setNewClassMax(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  min={1}
                  max={100}
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setFormError(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class List */}
        <div className="lg:col-span-1 space-y-3">
          {classes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-4xl mb-3">{'\u{1F3EB}'}</p>
              <p className="text-gray-500">No classes yet.</p>
              <p className="text-gray-400 text-sm mt-1">Create your first class to get started.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => fetchClassDetails(cls.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedClass?.id === cls.id
                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{cls.academicYear}</p>
              </button>
            ))
          )}
        </div>

        {/* Class Detail */}
        <div className="lg:col-span-2">
          {selectedClass ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedClass.name}</h2>
                  <p className="text-sm text-gray-500">{selectedClass.academicYear} &middot; Max {selectedClass.maxStudents} students</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Add Student
                  </button>
                  <button
                    onClick={() => handleDeleteClass(selectedClass.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete Class
                  </button>
                </div>
              </div>

              {/* Add Student Form */}
              {showAddStudent && (
                <form onSubmit={handleAddStudent} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Student by Email</h3>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <select
                        value={studentStage}
                        onChange={(e) => setStudentStage(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        {Object.entries(STAGE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddStudent(false); setFormError(''); setFormSuccess(''); }}
                      className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                  {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
                  {formSuccess && <p className="text-sm text-green-600 mt-2">{formSuccess}</p>}
                </form>
              )}

              {/* Student Table */}
              {selectedClass.students && selectedClass.students.length > 0 ? (
                <div>
                  {/* Curriculum language filter */}
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs font-medium text-gray-500">Curriculum language:</label>
                    <select
                      value={curriculumLang}
                      onChange={(e) => setCurriculumLang(e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="zh-Hans">Chinese</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Student</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Stage</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Curriculum</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Books Read</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Stars</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.students.map((student) => {
                        const configs = curriculumConfigs[student.userId] || [];
                        const langConfig = configs.find((c) => c.language === curriculumLang);
                        const assignedWordlistId = langConfig?.wordlistIds?.[0] || '';
                        const filteredWordLists = wordLists.filter((wl) => wl.language === curriculumLang);

                        return (
                        <tr key={student.profileId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <p className="font-medium text-gray-900">{student.displayName}</p>
                            <p className="text-xs text-gray-400">{student.email}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLORS[student.readingStage] || 'bg-gray-100 text-gray-600'}`}>
                              {STAGE_LABELS[student.readingStage] || student.readingStage}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={assignedWordlistId}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleAssignCurriculum(
                                  student.userId,
                                  val || null,
                                  curriculumLang
                                );
                              }}
                              disabled={savingCurriculum === student.userId}
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 w-full max-w-[180px] disabled:opacity-50"
                            >
                              <option value="">Default pool</option>
                              {filteredWordLists.map((wl) => (
                                <option key={wl.id} value={wl.id}>
                                  {wl.name} ({wl.words.length})
                                </option>
                              ))}
                            </select>
                            {savingCurriculum === student.userId && (
                              <span className="ml-1 text-[10px] text-indigo-500">Saving...</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-gray-600">{student.totalBooksRead}</td>
                          <td className="py-3 px-3 text-gray-600">{student.totalStars}</td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(student.profileId)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-3xl mb-2">{'\u{1F464}'}</p>
                  <p>No students in this class yet.</p>
                  <p className="text-xs mt-1">Add students by their registered email address.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <p className="text-4xl mb-3">{'\u{1F449}'}</p>
              <p className="text-gray-500">Select a class to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
