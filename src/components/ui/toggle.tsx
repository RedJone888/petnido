export default function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b last:border-0">
      <span>{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`w-12 h-6 rounded-full relative transition 
          ${value ? "bg-purple-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition
            ${value ? "left-6" : "left-0.5"}`}
        ></span>
      </button>
    </div>
  );
}
