import type { AuthUser } from "@/features/auth/types/auth-user";
import { VIEW_ROLES_PERMISSION } from "@/features/roles/permissions";
import { VIEW_USERS_PERMISSION } from "@/features/users/permissions";
import type {
  NavigationItem,
  NavigationSection,
} from "@/shared/types/navigation";

export const applicationNavigation: readonly NavigationSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        icon: "dashboard",
        label: "Dashboard",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/administration/users",
        icon: "users",
        label: "Users",
        requiredPermission: VIEW_USERS_PERMISSION,
      },
      {
        href: "/administration/roles",
        icon: "users",
        label: "Roles",
        requiredPermission: VIEW_ROLES_PERMISSION,
      },
    ],
  },
];

function canViewNavigationItem(
  item: NavigationItem,
  user: AuthUser,
): boolean {
  if (item.requiredPermission === undefined) {
    return true;
  }

  return user.permissions.includes(item.requiredPermission);
}

export function getVisibleNavigation(
  user: AuthUser,
): readonly NavigationSection[] {
  return applicationNavigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canViewNavigationItem(item, user)),
    }))
    .filter((section) => section.items.length > 0);
}
