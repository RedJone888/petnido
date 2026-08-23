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
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
