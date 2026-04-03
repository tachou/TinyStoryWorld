import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <span className="text-7xl block mb-4">{'\u{1F4DA}'}</span>
        <h1 className="text-4xl font-black text-gray-900">Page Not Found</h1>
        <p className="mt-3 text-gray-500 text-lg">
          Oops! This page seems to have wandered off into another story.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/portal/library"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Browse Library
          </Link>
        </div>
      </div>
    </div>
  );
}
