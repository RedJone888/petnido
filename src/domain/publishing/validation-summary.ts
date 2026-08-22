export type ServicePublishingStepId = "mode" | "basics" | "care" | "availability" | "pricing" | "review";

const fieldStep: Record<string, ServicePublishingStepId> = {
  mode: "mode",
  title: "basics",
  description: "basics",
  location: "basics",
  timeZone: "basics",
  homeVisit: "care",
  boarding: "care",
  custom: "care",
  petPolicies: "care",
  offerings: "care",
  availabilityRules: "availability",
  availabilityExceptions: "availability",
  currency: "pricing",
  priceRules: "pricing",
  discounts: "pricing",
  attachmentIds: "review",
};

export function summarizeServicePublishingIssues(issues: { path: (string | number)[]; message: string }[]) {
  return issues.map((issue) => {
    const field = String(issue.path[0] ?? "review");
    return {
      step: fieldStep[field] ?? "review",
      field,
      message: issue.message,
    };
  });
}
