export default function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold text-gray-800 leading-snug">
        {title}
      </h1>
      <p className="text-gray-600 text-sm mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
