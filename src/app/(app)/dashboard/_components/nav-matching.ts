export type DashboardNavMatchItem = {
  href: string;
  exact?: boolean;
};

type SearchParamsLike = {
  get(name: string): string | null;
};

/**
 * Keep dashboard navigation matching independent from the rendered sidebar.
 * The needs list and its drafts tab share a pathname, so the list item must
 * explicitly yield to the drafts item when that tab is selected.
 */
export function isDashboardNavItemActive(
  item: DashboardNavMatchItem,
  pathname: string,
  searchParams: SearchParamsLike,
) {
  if (item.exact || item.href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (item.href === "/dashboard/needs?tab=drafts") {
    return pathname === "/dashboard/needs" && searchParams.get("tab") === "drafts";
  }
  if (item.href === "/dashboard/needs") {
    return (
      (pathname === "/dashboard/needs" && searchParams.get("tab") !== "drafts") ||
      pathname.startsWith("/dashboard/needs/")
    );
  }
  if (item.href === "/dashboard/serviceprofile?tab=drafts") {
    return pathname === "/dashboard/serviceprofile" && searchParams.get("tab") === "drafts";
  }
  if (item.href === "/dashboard/serviceprofile") {
    return (
      (pathname === "/dashboard/serviceprofile" && searchParams.get("tab") !== "drafts") ||
      pathname.startsWith("/dashboard/serviceprofile/")
    );
  }
  if (item.href === "/dashboard/favorites?type=needs") {
    return pathname === "/dashboard/favorites" && searchParams.get("type") !== "services";
  }
  if (item.href === "/dashboard/favorites?type=services") {
    return pathname === "/dashboard/favorites" && searchParams.get("type") === "services";
  }
  if (item.href === "/dashboard/notifications?view=conversations") {
    return pathname === "/dashboard/notifications" && searchParams.get("view") === "conversations";
  }
  if (item.href === "/dashboard/notifications") {
    return pathname === "/dashboard/notifications" && searchParams.get("view") !== "conversations";
  }
  if (item.href === "/dashboard/profile") {
    return pathname === "/dashboard/profile";
  }
  if (item.href === "/dashboard/settings/security") {
    return pathname.startsWith("/dashboard/settings/");
  }
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
