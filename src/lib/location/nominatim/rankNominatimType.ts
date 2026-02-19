export function rankNominatimType(r: any): number {
  if (r.type === "station" || r.class === "railway") return 4;
  if (r.type === "stop") return 3;
  if (r.type === "administrative") return 2;
  if (r.type === "place") return 1;
  return 0;
}

// {isOpen &&
//         (searchByQuery.isFetching ? (
//           <div className="px-3 py-2 text-xs text-neutral-500">検索中…</div>
//         ) : (
//           <div className="absolute mt-1 w-full border bg-white rounded-lg shadow z-20 max-h-60 overflow-y-auto">
//             {searchByQuery.data && (searchByQuery.data.length === 0 ? (
//             <div className="px-3 py-2 text-xs text-neutral-500">
//               該当する住所がありません
//             </div>
//             ): (
//             {searchByQuery.data.map((opt: any, i: number) => (
//               <li
//                 key={i}
//                 onClick={() => {
//                   const selected = {
//                     label: opt.label,
//                     lat: opt.lat,
//                     lon: opt.lon,
//                   };
//                   setInput(selected.label);
//                   setQuery(selected.label);
//                   // onChange(selected);
//                   setIsOpen(false);
//                 }}
//                 className="w-full text-left px-3 py-2 hover:bg-gray-100"
//               >
//                 <span className="font-semibold text-sm">{opt.label} </span>
//                 <span className="text-muted-foreground text-xs">
//                   {opt.subLabel}
//                 </span>
//               </li>
//             ))}
//             ))}
//           </div>
//         ))}
