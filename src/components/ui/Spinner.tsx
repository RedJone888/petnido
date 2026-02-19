import React from "react";

interface Props {
  className?: string; // 允许传入额外的 margin 或颜色 (text-red-500)
  size?: string; // 大小，例如 "w-6 h-6"
  stroke?: string; // 粗细，例如 "stroke-2" 或 "stroke-[3px]"
}

export default function Spinner({
  className = "text-primary", // 默认颜色
  size = "w-8 h-8", // 默认大小
  stroke = "stroke-4", // 默认粗细 (Tailwind 类名)
}: Props) {
  return (
    <svg
      // 1. animate-spin: 旋转动画
      // 2. size: 控制整体宽高
      // 3. className: 控制颜色
      className={`animate-spin ${size} ${className}`}
      viewBox="0 0 50 50" // viewBox 固定为 50，方便计算粗细比例
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className={stroke} // 4. stroke: 控制线条粗细
        cx="25"
        cy="25"
        r="20"
        stroke="currentColor"
        strokeLinecap="round" // 【关键】圆头效果
        // 下面两个属性控制圆环的长度（缺口大小）
        // 20*2*3.14 ≈ 126 (周长)
        // 80/126 ≈ 63% 的长度
        strokeDasharray="80"
        strokeDashoffset="20"
      ></circle>
    </svg>
  );
}
{
  /* <div className="flex justify-center items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
            viewBox="0 0 50 50"
          >
            <circle
              className="stroke-current"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="5"
              // 【核心解决方案】
              strokeLinecap="round"
              // 这里的 dasharray 和 dashoffset 决定了圆弧的长度
              // 126 约等于周长的 100%，设置为 80 就会留出缺口
              strokeDasharray="80"
              strokeDashoffset="20"
            ></circle>
          </svg>
        </div> */
}
