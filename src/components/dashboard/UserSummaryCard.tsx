"use client";
import { useSession } from "next-auth/react";
import UserAvatar from "@/components/navbar/UserAvatar";
import { Button } from "@/components/ui/Button";
import { stringToAvatarColors } from "@/lib/avatarColor";
export default function UserSummaryCard() {
  const { data: session } = useSession();
  const name = session?.user?.name || "ゲスト";
  const email = session?.user?.email || "";
  // const { color1, color2 } = stringToAvatarColors(email || name);
  return (
    <section className="flex items-center justify-between gap-6 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-1">
          ようこそ、{name}さん
        </h1>
        <p className="text-sm text-neutral-600 max-w-xl">
          ここは、ペットとあなたをつなぐマイページです。
          依頼の管理、サービスプロフィール、メッセージの確認などをまとめて行えます。
        </p>
      </div>
      <div className="flex items-center gap-4">
        <UserAvatar
          image={session?.user?.image}
          name={session?.user?.name}
          email={session?.user?.email}
          size={64}
          // color1={color1}
          // color2={color2}
        />
        <div className="text-right">
          <p>{name}</p>
          {email && (
            <p className="text-xs text-neutral-500 truncate max-w-[200px]">
              {email}
            </p>
          )}
          <Button
            variant="primary"
            className="mt-2 px-4 py-1.5 text-xs rounded-full"
          >
            プロフィールを編集する
          </Button>
        </div>
      </div>
    </section>
  );
}
