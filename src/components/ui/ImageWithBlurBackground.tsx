"use client";
import React from "react";
import cn from "@/lib/cn";
interface Props {
  src: string;
  alt?: string;
  className?: string;
  blurIntensity?: string;
  fallback?: string;
}
export default function ImageWithBlurBackground({
  src,
  alt = "",
  className = "",
  blurIntensity = "blur-xl",
  fallback,
}: Props) {
  const imgSrc = src || fallback || "/placeholder.jpg";
  return (
    <div
      className={cn(
        "w-full h-full relative overflow-hidden flex items-end justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-center bg-cover scale-100",
          blurIntensity,
        )}
        style={{ backgroundImage: `url(${imgSrc})` }}
      ></div>
      <div className="absolute inset-0 bg-white/60 z-5"></div>
      <img
        src={imgSrc}
        alt={alt}
        className="relative bottom-0 z-10 w-full h-[75%] object-contain"
      />
    </div>
  );
}
