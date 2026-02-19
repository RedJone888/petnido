"use client";
interface NeedDetailPageProps {
  initialNeed: {
    id: string;
  } | null;
}
export default function NeedDetailPage({ initialNeed }: NeedDetailPageProps) {
  return (
    // <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
    //   <div className="bg-white rounded-xl w-[90%] max-w-5xl p-6 relative shadow-lg animate-fade-in">
    <div>
      {/* <h2 className="text-2xl font-bold mb-3">{initialNeed?.title}</h2> */}
      <p>test</p>
      {/* <p className="text-gray-600 mb-4">{initialNeed?.description}</p> */}

      {/* 图片 */}
      {/* {initialNeed?.photos?.length > 0 && (
        <img
          src={initialNeed?.photos[0]}
          className="w-full h-60 object-cover rounded-lg mb-4"
        />
      )} */}

      {/* 其他信息 */}
      {/* <div className="text-sm text-gray-700">
        📍 {initialNeed.city}
        <br />
        📅 {initialNeed.startDate.toISOString().slice(0, 10)} →
        {initialNeed.endDate.toISOString().slice(0, 10)}
      </div> */}
    </div>
    // </div>
  );
}
