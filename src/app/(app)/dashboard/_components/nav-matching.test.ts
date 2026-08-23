import { describe, expect, it } from "vitest";
import { isDashboardNavItemActive } from "./nav-matching";

function params(value = "") {
  return new URLSearchParams(value);
}

describe("dashboard navigation matching", () => {
  it("activates only drafts on the needs drafts tab", () => {
    const searchParams = params("tab=drafts");

    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/needs" },
        "/dashboard/needs",
        searchParams,
      ),
    ).toBe(false);
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/needs?tab=drafts" },
        "/dashboard/needs",
        searchParams,
      ),
    ).toBe(true);
  });

  it("keeps the published needs item active without the drafts tab", () => {
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/needs" },
        "/dashboard/needs",
        params(),
      ),
    ).toBe(true);
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/needs" },
        "/dashboard/needs",
        params("tab=published"),
      ),
    ).toBe(true);
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/needs?tab=drafts" },
        "/dashboard/needs",
        params("tab=published"),
      ),
    ).toBe(false);
  });

  it("retains path-prefix matching for need detail routes", () => {
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/needs" },
        "/dashboard/needs/v2/need-1",
        params(),
      ),
    ).toBe(true);
  });
});
