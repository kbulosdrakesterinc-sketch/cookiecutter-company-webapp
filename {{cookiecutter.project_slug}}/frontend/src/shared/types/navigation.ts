export type NavigationIconName = "dashboard" | "users";

export interface NavigationItem {
  readonly href: string;
  readonly icon: NavigationIconName;
  readonly label: string;
  readonly requiredPermission?: string;
}

export interface NavigationSection {
  readonly label?: string;
  readonly items: readonly NavigationItem[];
}
