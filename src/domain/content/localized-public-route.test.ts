import { describe, expect, it } from "vitest";

import {
  localizedPublicPathname,
  shouldHidePublicFooter,
} from "./localized-public-route";

describe("localized public route switching", () => {
  it("adds or replaces language prefixes on public pages", () => {
    expect(localizedPublicPathname("/needs", "ja")).toBe("/ja/needs");
    expect(localizedPublicPathname("/needs/need-123", "zh")).toBe(
      "/zh/needs/need-123",
    );
    expect(localizedPublicPathname("/en/services/service-123", "ja")).toBe(
      "/ja/services/service-123",
    );
    expect(localizedPublicPathname("/care-types", "ja")).toBe(
      "/ja/care-types",
    );
  });

  it("does not prefix application flows that have no localized route", () => {
    expect(localizedPublicPathname("/needs/create", "ja")).toBeNull();
    expect(
      localizedPublicPathname("/needs/edit/need-123", "ja"),
    ).toBeNull();
    expect(localizedPublicPathname("/dashboard/needs", "ja")).toBeNull();
    expect(localizedPublicPathname("/auth/sign-in", "ja")).toBeNull();
  });
});

describe("shouldHidePublicFooter", () => {
  it("hides footer on care-types page", () => {
    expect(shouldHidePublicFooter("/care-types")).toBe(true);
    expect(shouldHidePublicFooter("/en/care-types")).toBe(true);
    expect(shouldHidePublicFooter("/zh/care-types")).toBe(true);
  });

  it("hides footer on need detail page", () => {
    expect(shouldHidePublicFooter("/needs/need-123")).toBe(true);
    expect(shouldHidePublicFooter("/zh/needs/need-456")).toBe(true);
  });

  it("shows footer on home, needs list, and services list pages", () => {
    expect(shouldHidePublicFooter("/")).toBe(false);
    expect(shouldHidePublicFooter("/en")).toBe(false);
    expect(shouldHidePublicFooter("/needs")).toBe(false);
    expect(shouldHidePublicFooter("/ja/needs")).toBe(false);
    expect(shouldHidePublicFooter("/services")).toBe(false);
  });
});
