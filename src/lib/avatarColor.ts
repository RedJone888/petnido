//把字符串映射成稳定的hue
export function stringToHue(input: string | null | undefined): number {
  if (!input) return 260;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
//根据字符串生成一对渐变色（前景/高亮）
export function stringToAvatarColors(input: string | null | undefined) {
  const hue = stringToHue(input);
  //适合头像的饱和度&亮度
  const s = 70;
  const l = 55;
  //渐变色两端颜色
  const color1 = `hsl(${hue},${s}%,${l}%)`;
  const color2 = `hsl(${(hue + 20) % 360},${s}%,${l - 10}%)`;
  return { color1, color2 };
}
export function stringToAvatarAccent(input: string | null | undefined) {
  const hue = stringToHue(input);
  //主色调适度变亮，作为按钮hover的背景更合适
  return `hsl(${hue},85%,92%)`;
}
