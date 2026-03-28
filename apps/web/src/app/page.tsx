import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Tiny Story World</h1>
        <p className="mt-4 text-lg text-gray-600">
          A Multilingual Learning Platform for K-6 Classrooms
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Teacher Login
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 transition-colors"
        >
          Student Login
        </Link>
      </div>
    </main>
  );
}
