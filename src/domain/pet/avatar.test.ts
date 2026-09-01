import { describe, expect, it } from "vitest";
import { petAvatarPosition } from "./avatar";

describe("petAvatarPosition", () => {
  it("should return fine-tuned centered coordinates for row 1 pets", () => {
    expect(petAvatarPosition("DOG")).toBe("0% 5.556%");
    expect(petAvatarPosition("CAT")).toBe("33.333% 5.556%");
    expect(petAvatarPosition("RABBIT")).toBe("66.667% 5.556%");
    expect(petAvatarPosition("BIRD")).toBe("100% 5.556%");
  });

  it("should return centered coordinates for row 2 pets including ferret and turtle", () => {
    expect(petAvatarPosition("HAMSTER")).toBe("0% 50%");
    expect(petAvatarPosition("GUINEA_PIG")).toBe("33.333% 50%");
    expect(petAvatarPosition("guinea-pig")).toBe("33.333% 50%");
    expect(petAvatarPosition("FERRET")).toBe("66.667% 50%");
    expect(petAvatarPosition("TURTLE")).toBe("100% 50%");
  });

  it("should return fine-tuned centered coordinates for row 3 pets", () => {
    expect(petAvatarPosition("CHINCHILLA")).toBe("0% 94.444%");
    expect(petAvatarPosition("OTHER")).toBe("33.333% 94.444%");
    expect(petAvatarPosition("unknown_species")).toBe("33.333% 94.444%");
  });
});
