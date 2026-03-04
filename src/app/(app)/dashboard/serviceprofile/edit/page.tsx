"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import { serviceSchema, ServiceInput } from "@/lib/zod/services";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, PawPrint, ExternalLink } from "lucide-react";

// 快速选择用的选项
const petOptions = ["犬", "猫", "うさぎ", "ハムスター", "フェレット", "小動物"];

const serviceOptions = [
  "訪問ケア",
  "散歩のみ",
  "お預かり（自宅）",
  "送迎サービス",
  "オンライン相談",
];

function toggleInArray(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function EditProfilePage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // 读取现有プロフィール
  // const { data: profile, isLoading } = trpc.services.getMine.useQuery();

  // const updateProfile = trpc.services.update.useMutation({
  //   onSuccess: async () => {
  //     await utils.services.getMine.invalidate();
  //     setLastSavedAt(new Date());
  //     setSaving(false);
  //   },
  //   onError: (err) => {
  //     setSaving(false);
  //     toast.error(err.message || "保存に失敗しました");
  //   },
  // });

  // const form = useForm<>({
  //   resolver: zodResolver(),
  //   defaultValues: {
  //     bio: "",
  //     petTypes: [],
  //     experience: 0,
  //     services: [],
  //     price: 0,
  //     area: "",
  //     availability: "",
  //     images: [],
  //   },
  // });

  // const {
  //   register,
  //   handleSubmit,
  //   setValue,
  //   watch,
  //   reset,
  //   formState: { errors },
  // } = form;

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 初次载入时用 profile 填充表单
  // useEffect(() => {
  //   if (profile) {
  //     reset({
  //       bio: profile.bio ?? "",
  //       petTypes: profile.petTypes ?? [],
  //       experience: profile.experience ?? 0,
  //       services: profile.services ?? [],
  //       price: profile.price ?? 0,
  //       area: profile.area ?? "",
  //       availability: profile.availability ?? "",
  //       images: profile.images ?? [],
  //     });
  //     setPreviewUrls(profile.images ?? []);
  //   }
  // }, [profile, reset]);

  // 自动保存字段（混合模式：文本类自动保存，其他字段手动）
  // const autoSaveFields = watch(["bio", "area", "availability", "experience"]);

  // useEffect(() => {
  //   if (!profile) return; // 还没加载完不要保存

  //   const timeout = setTimeout(() => {
  //     const values = form.getValues();
  //     setSaving(true);
  //     updateProfile.mutate(values);
  //   }, 1000); // 1秒 debounce

  //   return () => clearTimeout(timeout);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   autoSaveFields[0],
  //   autoSaveFields[1],
  //   autoSaveFields[2],
  //   autoSaveFields[3],
  // ]);

  // 手动保存：包括图片、petTypes、services 等全部字段
  // const onSubmit = (values: ServiceInput) => {
  //   setSaving(true);
  //   updateProfile.mutate(values);
  // };

  const savingLabel = useMemo(() => {
    if (saving) return "保存中…";
    if (lastSavedAt)
      return `保存しました ✓（${lastSavedAt.toLocaleTimeString()}）`;
    return "";
  }, [saving, lastSavedAt]);

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center py-16 text-sm text-neutral-600">
  //       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  //       読み込み中…
  //     </div>
  //   );
  // }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">
            サービスプロフィールを編集する
          </h1>
          <p className="text-sm text-neutral-600">
            飼い主さんに表示される情報です。自己紹介や対応可能なペット、料金、エリアなどを設定しましょう。
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savingLabel && (
            <span className="text-xs text-neutral-500">{savingLabel}</span>
          )}
          {/* {profile && (
            <Button
              type="button"
              variant="outlineDark"
              className="px-4 py-2 text-xs"
              onClick={() => router.push(`/sitters/${profile.userId}`)}
            >
              公開プロフィールを見る
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )} */}
        </div>
      </div>

      {/* Notion 風カード */}
      <form
        // onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 bg-neutral-50/80 border border-neutral-200 rounded-3xl p-6"
      >
        {/* 自己紹介 */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-[--purple2]" />
            自己紹介
          </h2>
          <p className="text-xs text-neutral-500">
            あなたの経験、ペットへの想い、得意なケアなどを書いてください。
          </p>
          <textarea
            // {...register("bio")}
            rows={5}
            className="w-full rounded-2xl border border-neutral-200 p-3 text-sm resize-none bg-white"
            placeholder="例：子どもの頃からずっとうさぎと暮らしてきました。繊細な子でも安心して過ごせるよう、静かな環境づくりとゆっくりしたコミュニケーションを大切にしています。"
          />
          {/* {errors.bio && (
            <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>
          )} */}
        </section>

        {/* 対応ペット & サービス（模板） */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* ペット種類 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              対応可能なペット
            </h3>
            <p className="text-xs text-neutral-500 mb-2">
              当てはまるものを選んでください。複数選択できます。
            </p>
            <div className="flex flex-wrap gap-2">
              {petOptions.map((p) => {
                // const selected = watch("petTypes")?.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    // onClick={() =>
                    //   setValue(
                    //     "petTypes",
                    //     toggleInArray(watch("petTypes") || [], p),
                    //     { shouldDirty: true }
                    //   )
                    // }
                    // className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    //   selected
                    //     ? "bg-[--purple1]/10 border-[--purple2] text-[--purple2]"
                    //     : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    // }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {/* {errors.petTypes && (
              <p className="text-xs text-red-500 mt-1">
                {errors.petTypes.message as string}
              </p>
            )} */}
          </div>

          {/* サービス種類 */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              提供できるサービス
            </h3>
            <p className="text-xs text-neutral-500 mb-2">
              実際に提供可能なものを選んでください。
            </p>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((s) => {
                // const selected = watch("services")?.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    // onClick={() =>
                    //   setValue(
                    //     "services",
                    //     toggleInArray(watch("services") || [], s),
                    //     { shouldDirty: true }
                    //   )
                    // }
                    // className={`px-3 py-1.5 rounded-full text-xs border transition ${
                    //   selected
                    //     ? "bg-[--purple1]/10 border-[--purple2] text-[--purple2]"
                    //     : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    // }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {/* {errors.services && (
              <p className="text-xs text-red-500 mt-1">
                {errors.services.message as string}
              </p>
            )} */}
          </div>
        </section>

        {/* 料金 & エリア & スケジュール */}
        <section className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              基本料金（目安）
            </h3>
            <p className="text-xs text-neutral-500 mb-2">
              1回あたり、または1日あたりの目安料金です。
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                // {...register("price", { valueAsNumber: true })}
                className="flex-1 rounded-2xl border border-neutral-200 p-2 text-sm bg-white"
                placeholder="例：3000"
              />
              <span className="text-xs text-neutral-600">円</span>
            </div>
            {/* {errors.price && (
              <p className="text-xs text-red-500 mt-1">
                {errors.price.message}
              </p>
            )} */}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              対応エリア
            </h3>
            <p className="text-xs text-neutral-500 mb-2">
              市区町村や沿線名など、大まかなエリアを書いてください。
            </p>
            <input
              // {...register("area")}
              className="w-full rounded-2xl border border-neutral-200 p-2 text-sm bg-white"
              placeholder="例：大阪市内（此花区・北区周辺）"
            />
            {/* {errors.area && (
              <p className="text-xs text-red-500 mt-1">{errors.area.message}</p>
            )} */}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
              スケジュール
            </h3>
            <p className="text-xs text-neutral-500 mb-2">
              例：平日夜間 / 土日終日など、ざっくりで構いません。
            </p>
            <input
              // {...register("availability")}
              className="w-full rounded-2xl border border-neutral-200 p-2 text-sm bg-white"
              placeholder="例：平日19時以降 / 土日祝は終日OK"
            />
            {/* {errors.availability && (
              <p className="text-xs text-red-500 mt-1">
                {errors.availability.message}
              </p>
            )} */}
          </div>
        </section>

        {/* 写真（头像 / 环境） */}
        <section>
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            プロフィール写真（任意）
          </h3>
          <p className="text-xs text-neutral-500 mb-2">
            ペットと一緒の写真や、お世話スペースの写真などがあると安心感が高まります。
          </p>
          <div className="flex flex-wrap gap-4 items-start">
            <label className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl border border-dashed border-neutral-300 bg-white text-xs text-neutral-500 cursor-pointer hover:bg-neutral-50">
              <span className="mb-1 text-lg">＋</span>
              画像を追加
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  // const current = watch("images") || [];
                  // const next = [...current, url];
                  // setPreviewUrls(next);
                  // setValue("images", next, { shouldDirty: true });
                }}
              />
            </label>
            {previewUrls.map((url, idx) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  className="w-28 h-28 object-cover rounded-2xl border"
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                  onClick={() => {
                    const next = previewUrls.filter((u) => u !== url);
                    setPreviewUrls(next);
                    // setValue("images", next, { shouldDirty: true });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 手动保存按钮 */}
        <div className="pt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="outlineDark"
            className="px-6 py-2"
            onClick={() => router.push("/dashboard/profile")}
          >
            キャンセル
          </Button>
          <Button type="submit" variant="primary" className="px-6 py-2">
            変更を保存する
          </Button>
        </div>
      </form>
    </div>
  );
}
