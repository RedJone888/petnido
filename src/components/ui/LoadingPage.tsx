import Spinner from "./Spinner";

export default function LoadingPage({
  title,
  size = "w-12 h-12",
}: {
  title: string;
  size?: string;
}) {
  return (
    <div className="w-full h-full bg-white opacity-80 flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Spinner size={size} />
      <p className="text-slate-800 font-bold">{title}</p>
    </div>
  );
}
