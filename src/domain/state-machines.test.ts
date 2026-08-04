import { describe, expect, it } from "vitest";

import { transitionApplication } from "./application/state-machine";
import { transitionBooking } from "./booking/state-machine";
import { transitionConversation } from "./conversation/state-machine";
import { isNeedExpired, isNeedPublic, transitionNeed } from "./need/state-machine";
import { assertBoardingCapacity } from "./service/capacity";
import { transitionService } from "./service/state-machine";
import { DomainTransitionError } from "./shared/state-machine";

describe("domain state machines", () => {
  it.each([
    ["DRAFT", "PUBLISH", "OPEN"],
    ["OPEN", "SELECT_PROVIDER", "MATCHED"],
    ["MATCHED", "REMOVE_PROVIDER", "OPEN"],
    ["MATCHED", "CLOSE", "CLOSED"],
  ] as const)("transitions Need %s via %s to %s", (from, command, expected) => {
    expect(transitionNeed(from, command)).toBe(expected);
  });

  it("rejects illegal transitions with a stable code", () => {
    expect(() => transitionNeed("CLOSED", "PUBLISH")).toThrow(DomainTransitionError);
    try {
      transitionNeed("CLOSED", "PUBLISH");
    } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_STATE_TRANSITION" });
    }
  });

  it("treats equality with endsAt as expired", () => {
    const now = new Date("2026-08-04T00:00:00.000Z");
    expect(isNeedExpired(new Date(now), now)).toBe(true);
    expect(isNeedPublic("OPEN", new Date("2026-08-04T00:00:01.000Z"), now)).toBe(true);
    expect(isNeedPublic("MATCHED", new Date("2026-08-04T00:00:01.000Z"), now)).toBe(false);
  });

  it("covers interaction and service commands", () => {
    expect(transitionApplication("PENDING", "ACCEPT")).toBe("ACCEPTED");
    expect(transitionBooking("PENDING", "CONFIRM")).toBe("CONFIRMED");
    expect(transitionService("ACTIVE", "PAUSE")).toBe("PAUSED");
    expect(transitionConversation("ARCHIVED", "REOPEN")).toBe("ACTIVE");
  });
});

describe("boarding capacity", () => {
  it("checks pet count only for boarding", () => {
    expect(() =>
      assertBoardingCapacity({
        serviceMode: "BOARDING",
        maxPetCapacity: 4,
        confirmedPetCount: 2,
        requestedPetCount: 2,
      }),
    ).not.toThrow();

    expect(() =>
      assertBoardingCapacity({
        serviceMode: "BOARDING",
        maxPetCapacity: 4,
        confirmedPetCount: 3,
        requestedPetCount: 2,
      }),
    ).toThrow("BOARDING_CAPACITY_EXCEEDED");

    expect(() =>
      assertBoardingCapacity({
        serviceMode: "HOME_VISIT",
        maxPetCapacity: null,
        confirmedPetCount: 999,
        requestedPetCount: 999,
      }),
    ).not.toThrow();
  });
});
