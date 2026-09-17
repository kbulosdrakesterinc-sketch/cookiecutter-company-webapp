"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/shared/types/navigation";

import { NavigationIcon } from "./navigation-icon";

interface NavigationLinkProps {
  readonly item: NavigationItem;
  readonly onNavigate?: () => void;
}

export function NavigationLink({
  item,
  onNavigate,
}: NavigationLinkProps): React.ReactNode {
  const pathname = usePathname();

  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
      href={item.href}
      onClick={onNavigate}
    >
      <NavigationIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}
