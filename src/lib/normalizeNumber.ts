export const normalizeNumber = (value: string): string => {
  if (!value) return "0";

  // 1. 全角数字转半角
  let normalized = value.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0),
  );

  // 2. 剔除所有非数字字符（禁止小数点、字母等）
  normalized = normalized.replace(/\D/g, "");

  // 3. 处理前导零：如果只有 "0" 后面跟了数字，去掉前面的 0
  if (normalized.length > 1 && normalized.startsWith("0")) {
    normalized = normalized.replace(/^0+/, "");
  }

  return normalized || "0";
};
