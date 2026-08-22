import { describe, expect, it } from "vitest";

import { summarizeServicePublishingIssues } from "./validation-summary";

describe("service publishing error summary", () => {
  it("maps nested schema issues back to the step where the user can fix them", () => {
    expect(summarizeServicePublishingIssues([
      { path: ["petPolicies", 0, "petType"], message: "Required" },
      { path: ["availabilityRules"], message: "Add availability" },
      { path: ["priceRules", 0, "amountMinor"], message: "Positive amount required" },
      { path: ["unknown"], message: "Review" },
    ])).toEqual([
      { step: "care", field: "petPolicies", message: "Required" },
      { step: "availability", field: "availabilityRules", message: "Add availability" },
      { step: "pricing", field: "priceRules", message: "Positive amount required" },
      { step: "review", field: "unknown", message: "Review" },
    ]);
  });
});
