"use client";
import ReactECharts from "echarts-for-react";

interface PieChartProps {
  title: string;
  data: { value: number; name: string }[];
  colors?: string[];
  // 容器宽高自定义
  width?: string | number;
  height?: string | number;
  // 位置自定义属性
  titlePos?: { top?: string | number; left?: string | number };
  legendPos?: {
    top?: string | number;
    left?: string | number;
    orient?: "horizontal" | "vertical";
  };
  chartCenter?: [string | number, string | number]; // 饼图中心坐标 [x, y]
  chartRadius?: [string | number, string | number]; // 饼图内外半径
}

export default function CommonPieChart({
  title,
  data,
  colors,
  width = "100%", // 默认宽度全满
  height = "320px", // 默认高度 320px (对应原代码的 h-80)
  titlePos = { top: "top", left: "center" }, // 默认值
  legendPos = { top: "80%", left: "center", orient: "horizontal" },
  chartCenter = ["50%", "42%"],
  chartRadius = ["55%", "75%"],
}: PieChartProps) {
  const option = {
    title: {
      text: title,
      left: titlePos.left,
      top: titlePos.top,
      textStyle: { fontSize: 12, color: "#6A5ACD" },
    },
    legend: {
      orient: legendPos.orient,
      left: legendPos.left,
      top: legendPos.top,
      icon: "circle",
      itemWidth: 10, // 设置宽度为 8px
      itemHeight: 10,
      textStyle: {
        color: "#666666",
        padding: [0, 0, 0, -1],
        fontSize: 11,
      },
    },
    series: [
      {
        type: "pie",
        center: chartCenter,
        radius: chartRadius,
        avoidLabelOverlap: false,
        padAngle: 5,
        color: colors,
        data: data,
        label: {
          show: false,
          color: "#6A5ACD",
          position: "center",
          formatter: "{bold|{b}}\n{light|{c}件 ({d}%)}",
          rich: {
            bold: { fontSize: 16, fontWeight: "bold", lineHeight: 25 },
            light: { fontSize: 12, fontWeight: "lighter", lineHeight: 20 },
          },
        },
        labelLine: { show: false },
        emphasis: {
          label: { show: true },
        },
      },
    ],
  };

  return (
    <div style={{ width: width, height: height }} className="">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
      />
    </div>
  );
}
