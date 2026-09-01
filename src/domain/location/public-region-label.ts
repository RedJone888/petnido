export function isAreaLevelLocationLabel(
  value: string | null | undefined,
) {
  const label = value?.trim();
  if (!label) return false;

  // Keep actual road names out of marketplace cards. Chinese `街道`, however,
  // is an administrative subdistrict and is intentionally handled below.
  if (
    /(expressway|highway|route|street|road|avenue|line|高速|道路)/i.test(
      label,
    )
  ) {
    return false;
  }

  return /街道|[市区县縣町村乡鄉镇鎮]|\b(city|ward|district|town|village)\b/i.test(
    label,
  );
}
