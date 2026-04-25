"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-10">
      <h2 className="text-red-500">おっと、エラーが発生しました。</h2>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-primary text-white rounded"
      >
        再試行する
      </button>
    </div>
  );
}
