import React from "react";

interface LoadingSpinnerProps {
  /**
   * Tailwind 颜色类名，例如 "text-blue-500", "text-white"
   * 默认为 "text-purple-600"
   */
  color?: string;
  /**
   * Tailwind 大小类名，例如 "w-8 h-8", "w-16 h-16"
   * 默认为 "w-10 h-10"
   */
  size?: string;
  /**
   * Tailwind 粗细类名。可以使用 stroke-1, stroke-2, 或者任意值 stroke-[4px]
   * 注意：数字是相对于 viewBox 50 的比例。
   * 默认为 "stroke-[4px]" (看起来比较适中)
   */
  thickness?: string;
  /**
   * 额外的样式类名，用于 margin 等
   */
  className?: string;
}

export default function LoadingSpinner({
  color = "text-purple-600",
  size = "w-10 h-10",
  thickness = "stroke-[5px]", // 默认稍微粗一点更好看
  className = "",
}: LoadingSpinnerProps) {
  // 定义圆的基本参数（基于 50x50 的画布）
  const center = 25;
  const radius = 20;
  // 计算周长：2 * PI * r ≈ 125.6
  const circumference = 2 * Math.PI * radius;
  // 前景圈的长度，设置为周长的 70% 左右，留出缺口
  const dashArray = circumference * 0.7;

  return (
    <svg
      // 1. animate-spin: 让整体旋转
      // 2. size & color: 应用传入的大小和颜色
      className={`animate-spin ${size} ${color} ${className}`}
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* --- 背景圈（浅色底）--- */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        // 继承父级 text-color
        stroke="currentColor"
        // 关键：设置透明度，使其看起来像背景
        strokeOpacity="0.15"
        // 应用传入的粗细
        className={thickness}
      />

      {/* --- 前景圈（深色动）--- */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="currentColor"
        // 【核心】圆头端点
        strokeLinecap="round"
        // 利用虚线特性创建缺口：实线长度 + 空隙长度
        strokeDasharray={`${dashArray} ${circumference}`}
        // 应用传入的粗细
        className={thickness}
      />
    </svg>
  );
}
{
  /* <svg
  className="animate-spin -ml-1 mr-3 h-8 w-8 text-purple-600"
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
>
  <circle
    className="opacity-25"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    strokeWidth="4"
  ></circle>
  <path
    className="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
  ></path>
</svg>; */
}
