export default function ProtectedLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-400 font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
