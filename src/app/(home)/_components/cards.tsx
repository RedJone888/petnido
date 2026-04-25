export function Card({
  icon,
  title,
  content,
}: {
  icon: string;
  title: string;
  content: string;
}) {
  return (
    // <div className="p-8 border border-card-border rounded-2xl bg-card shadow-sm hover:shadow-md transition">
    //   <div className="text-xl font-semibold text-primary-hover mb-4 flex items-center gap-2">
    //     <span>{icon}</span>
    //     <span>{title}</span>
    //   </div>
    //   <p className="text-gray-600 leading-relaxed">{content}</p>

    // </div>
    <div className="group p-8 md:p-10 border border-gray-100 rounded-3xl bg-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-start h-full">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed text-sm md:text-base">
        {content}
      </p>
    </div>
  );
}
