"use client";
import Image from "next/image";
import { stringToAvatarColors } from "@/lib/avatarColor";
export default function UserAvatar({
  image,
  name,
  email,
  size = 36,
}: {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
}) {
  const idBase = name || email || "";
  const { color1, color2 } = stringToAvatarColors(idBase);
  const fallback =
    name?.charAt(0).toUpperCase() || email?.charAt(0)?.toUpperCase() || "?";
  if (image) {
    return (
      <Image
        src={image}
        alt="avatar"
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="rounded-full text-white flex items-center justify-center font-bold shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        backgroundImage: `linear-gradient(135deg, ${color1}, ${color2})`,
      }}
    >
      <span>{fallback}</span>
    </div>
  );
}
