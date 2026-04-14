'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookReader } from '@/features/reader/components/BookReader';
import { VocabularyCards } from '@/features/reader/components/VocabularyCards';
import { QuizModal } from '@/features/quiz/components/QuizModal';
import { useLanguageStore } from '@/stores/languageStore';

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = searchParams.get('bookId');
  const activeWords = useLanguageStore((s) => s.activeWords);
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vocabWords, setVocabWords] = useState<string[]>([]);
  const [showVocab, setShowVocab] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (!bookId) {
      setError('No book selected');
      setLoading(false);
      return;
    }

    async function loadBook() {
      try {
        const res = await fetch(`/api/books/${bookId}`);
        if (!res.ok) {
          setError('Book not found');
          return;
        }
        const data = await res.json();
        setBook(data);

        // Check for curriculum scores — find unmatched words for pre-reading cards
        try {
          const wlRes = await fetch('/api/word-lists');
          if (wlRes.ok) {
            const wordLists = await wlRes.json();
            if (wordLists.length > 0) {
              const matchingWl = wordLists.find(
                (wl: any) => wl.language === data.language
              );
              if (matchingWl) {
                const scoresRes = await fetch(
                  `/api/books/curriculum-scores?wordlistId=${matchingWl.id}`
                );
                if (scoresRes.ok) {
                  const scoreMap = await scoresRes.json();
                  const bookScore = scoreMap[bookId!];
                  if (bookScore?.unmatchedWords?.length > 0) {
                    setVocabWords(bookScore.unmatchedWords.slice(0, 10));
                    setShowVocab(true);
                  }
                }
              }
            }
          }
        } catch {
          // Non-critical — skip vocab cards
        }
      } catch {
        setError('Failed to load book');
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookId]);

  const handleClose = () => {
    router.push('/dashboard/books');
  };

  const handleSessionComplete = async (pagesRead: number, durationSeconds: number) => {
    // Teachers previewing — still log reading sessions for completeness
    try {
      await fetch('/api/reading-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, pagesRead, durationSeconds }),
      });
    } catch {
      // Non-critical
    }
  };

  const handleStartQuiz = async () => {
    if (!bookId) return;
    setQuizLoading(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          curriculumWords: activeWords.length > 0 ? activeWords.map(w => w.word) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuizData(data);
        setShowQuiz(true);
      }
    } catch (err) {
      console.error('Failed to load quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-lg">{error || 'Something went wrong'}</p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Books
        </button>
      </div>
    );
  }

  return (
    <>
      {showVocab && vocabWords.length > 0 && (
        <VocabularyCards
          words={vocabWords}
          language={book.language}
          onDismiss={() => setShowVocab(false)}
        />
      )}
      {showQuiz && quizData && (
        <QuizModal
          bookId={bookId!}
          bookTitle={quizData.bookTitle}
          questions={quizData.questions}
          onClose={() => setShowQuiz(false)}
          onComplete={(score) => {
            console.log(`Quiz complete: ${score}%`);
          }}
        />
      )}
      <div className="relative">
        <BookReader
          book={book}
          onClose={handleClose}
          onSessionComplete={handleSessionComplete}
          showTranslationToggle={true}
          backLabel="Back to Books"
        />
        {/* Quiz button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={handleStartQuiz}
            disabled={quizLoading}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
            title="Take a comprehension quiz"
          >
            {quizLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <span>{'\u{1F4DD}'}</span>
            )}
            Quiz
          </button>
        </div>
      </div>
    </>
  );
}

export default function TeacherBookPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
