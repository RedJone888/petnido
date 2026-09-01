/**
 * Globally shared helper to get sprite coordinate for pet default avatar background.
 * Uses /images/pet-default-avatars-v2.png (4 columns x 3 rows grid).
 * Coordinates are fine-tuned (5.556%, 50%, 94.444%) for optimal vertical centering in circular crops.
 */
export function petAvatarPosition(petType: string): string {
  const normalized = (petType || "").trim().toUpperCase().replace(/-/g, "_");

  // Row 1 (5.556% for vertical centering)
  if (normalized === "DOG") return "0% 5.556%";
  if (normalized === "CAT") return "33.333% 5.556%";
  if (normalized === "RABBIT") return "66.667% 5.556%";
  if (normalized === "BIRD") return "100% 5.556%";

  // Row 2 (50% centered)
  if (normalized === "HAMSTER") return "0% 50%";
  if (normalized === "GUINEA_PIG" || normalized === "GUINEAPIG") return "33.333% 50%";
  if (normalized === "FERRET") return "66.667% 50%";
  if (normalized === "TURTLE") return "100% 50%";

  // Row 3 (94.444% for vertical centering)
  if (normalized === "CHINCHILLA") return "0% 94.444%";
  return "33.333% 94.444%"; // OTHER fallback
}
