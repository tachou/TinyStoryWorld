'use client';

import { useState } from 'react';

interface QuizQuestion {
  id: number;
  type: 'literal' | 'inferential' | 'applied';
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizModalProps {
  bookId: string;
  bookTitle: string;
  questions: QuizQuestion[];
  onClose: () => void;
  onComplete: (score: number) => void;
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  literal: { label: 'Recall', color: 'bg-blue-100 text-blue-700' },
  inferential: { label: 'Think Deeper', color: 'bg-purple-100 text-purple-700' },
  applied: { label: 'Connect', color: 'bg-green-100 text-green-700' },
};

export function QuizModal({ bookId, bookTitle, questions, onClose, onComplete }: QuizModalProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; selectedIndex: number; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const question = questions[currentQ];
  const totalQuestions = questions.length;
  const correctCount = answers.filter((a) => a.correct).length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelectedIndex(idx);
  };

  const handleCheck = () => {
    if (selectedIndex === null) return;
    setRevealed(true);
    setAnswers((prev) => [
      ...prev,
      {
        questionId: question.id,
        selectedIndex,
        correct: selectedIndex === question.correctIndex,
      },
    ]);
  };

  const handleNext = async () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedIndex(null);
      setRevealed(false);
    } else {
      // Submit results
      setFinished(true);
      setSubmitting(true);
      try {
        await fetch('/api/quizzes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId,
            answers: [...answers, { questionId: question.id, selectedIndex, correct: selectedIndex === question.correctIndex }],
            score: score / 100,
            comprehensionType: 'mixed',
          }),
        });
      } catch (err) {
        console.error('Failed to save quiz:', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (finished) {
    const finalCorrect = answers.filter((a) => a.correct).length;
    const finalScore = Math.round((finalCorrect / totalQuestions) * 100);
    const emoji = finalScore >= 80 ? '\u{1F31F}' : finalScore >= 60 ? '\u{1F44D}' : '\u{1F4AA}';
    const message =
      finalScore >= 80
        ? 'Amazing work!'
        : finalScore >= 60
        ? 'Good job! Keep reading!'
        : 'Nice try! Read again to improve!';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
          <span className="text-6xl">{emoji}</span>
          <h2 className="text-2xl font-black text-gray-900 mt-4">Quiz Complete!</h2>
          <p className="text-gray-600 mt-2">{bookTitle}</p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-black text-indigo-600">{finalScore}%</p>
              <p className="text-xs text-gray-500 mt-1">Score</p>
            </div>
            <div className="w-px h-12 bg-gray-200" />
            <div className="text-center">
              <p className="text-4xl font-black text-green-600">
                {finalCorrect}/{totalQuestions}
              </p>
              <p className="text-xs text-gray-500 mt-1">Correct</p>
            </div>
          </div>

          <p className="text-sm font-medium text-gray-700 mt-4">{message}</p>

          {/* Answer review */}
          <div className="mt-6 space-y-2 text-left">
            {questions.map((q, idx) => {
              const ans = answers[idx];
              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                    ans?.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span>{ans?.correct ? '\u2705' : '\u274C'}</span>
                  <span className="truncate flex-1">Q{idx + 1}: {q.question}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              onComplete(finalScore);
              onClose();
            }}
            disabled={submitting}
            className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    );
  }

  const typeBadge = TYPE_BADGES[question.type] || TYPE_BADGES.literal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Reading Quiz</p>
              <p className="font-bold truncate">{bookTitle}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold">
                {currentQ + 1} / {totalQuestions}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + (revealed ? 1 : 0)) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadge.color}`}>
              {typeBadge.label}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 leading-snug">
            {question.question}
          </h3>

          {/* Options */}
          <div className="mt-4 space-y-2">
            {question.options.map((option, idx) => {
              let className =
                'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ';

              if (revealed) {
                if (idx === question.correctIndex) {
                  className += 'border-green-500 bg-green-50 text-green-800';
                } else if (idx === selectedIndex) {
                  className += 'border-red-400 bg-red-50 text-red-700';
                } else {
                  className += 'border-gray-200 bg-gray-50 text-gray-400';
                }
              } else if (idx === selectedIndex) {
                className += 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200';
              } else {
                className += 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={className}
                  disabled={revealed}
                >
                  <span className="font-bold mr-2 text-gray-400">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {revealed && (
            <div
              className={`mt-4 p-3 rounded-xl text-sm font-medium ${
                selectedIndex === question.correctIndex
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {selectedIndex === question.correctIndex
                ? '\u2705 Correct! Great job!'
                : `\u274C The correct answer was: ${String.fromCharCode(65 + question.correctIndex)}. ${question.options[question.correctIndex]}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Quit Quiz
          </button>

          {!revealed ? (
            <button
              onClick={handleCheck}
              disabled={selectedIndex === null}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {currentQ < totalQuestions - 1 ? 'Next Question' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
