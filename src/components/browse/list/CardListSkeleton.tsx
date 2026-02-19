export default function CardListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-48 bg-gray-200 rounded-xl animate-pulse"
        ></div>
      ))}
    </div>
  );
}
