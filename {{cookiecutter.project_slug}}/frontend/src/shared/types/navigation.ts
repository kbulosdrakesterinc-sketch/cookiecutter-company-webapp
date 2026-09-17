export type NavigationIconName = "dashboard";

export interface NavigationItem {
  readonly href: string;
  readonly icon: NavigationIconName;
  readonly label: string;
}
