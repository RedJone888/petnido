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

  it("separates published services from service drafts", () => {
    expect(isDashboardNavItemActive({ href: "/dashboard/serviceprofile" }, "/dashboard/serviceprofile", params("tab=drafts"))).toBe(false);
    expect(isDashboardNavItemActive({ href: "/dashboard/serviceprofile?tab=drafts" }, "/dashboard/serviceprofile", params("tab=drafts"))).toBe(true);
  });

  it("separates saved requests from saved services", () => {
    expect(isDashboardNavItemActive({ href: "/dashboard/favorites?type=needs" }, "/dashboard/favorites", params("type=needs"))).toBe(true);
    expect(isDashboardNavItemActive({ href: "/dashboard/favorites?type=services" }, "/dashboard/favorites", params("type=needs"))).toBe(false);
  });

  it("separates activity notifications from the conversations view", () => {
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/notifications" },
        "/dashboard/notifications",
        params("view=conversations"),
      ),
    ).toBe(false);
    expect(
      isDashboardNavItemActive(
        { href: "/dashboard/notifications?view=conversations" },
        "/dashboard/notifications",
        params("view=conversations"),
      ),
    ).toBe(true);
  });

  it("separates the basic profile route from pet profiles", () => {
    expect(isDashboardNavItemActive({ href: "/dashboard/profile" }, "/dashboard/profile/pets", params())).toBe(false);
    expect(isDashboardNavItemActive({ href: "/dashboard/profile/pets" }, "/dashboard/profile/pets", params())).toBe(true);
  });

  it("keeps settings active across its canonical child routes", () => {
    expect(isDashboardNavItemActive({ href: "/dashboard/settings/security" }, "/dashboard/settings/language", params())).toBe(true);
  });
});
