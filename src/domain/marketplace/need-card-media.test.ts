import { describe, expect, it } from "vitest";

import { resolveNeedCardPetMedia } from "./need-card-media";

describe("resolveNeedCardPetMedia", () => {
  it("uses the first later pet that has a snapshot attachment URL", () => {
    const result = resolveNeedCardPetMedia([
      { petType: "DOG", image: null },
      { petType: "CAT", image: "" },
      { petType: "RABBIT", image: "/rabbit.jpg" },
    ]);

    expect(result.coverImage).toBe("/rabbit.jpg");
    expect(result.featuredPet?.petType).toBe("RABBIT");
    expect(result.fallbackPetType).toBe("DOG");
  });

  it("falls back to the first pet type when no snapshot has an image", () => {
    const result = resolveNeedCardPetMedia([
      { petType: "BIRD", image: null },
      { petType: "CAT", image: null },
    ]);

    expect(result.coverImage).toBeNull();
    expect(result.fallbackPetType).toBe("BIRD");
  });
});
